const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
  AutoModerationRuleTriggerType,
  AutoModerationRuleEventType,
  AutoModerationActionType,
} = require("discord.js");
const { isExpired } = require("../utils/time");

const MAX_WORDS = 10;
const MAX_WORD_LENGTH = 60;
const RULE_NAME = "Alfred Word Moderation";

const MAX_TIMEOUT_MS = 2147483647;

const enforcementTimers = new Map();

const wordsKey = (guildId) => `wordmodwords_${guildId}`;
const enabledKey = (guildId) => `wordmodenabled_${guildId}`;
const ruleIdKey = (guildId) => `wordmodruleid_${guildId}`;

function errorEmbed(description) {
  return new EmbedBuilder()
    .setTitle("❌ Error")
    .setDescription(description)
    .setColor(0xed4245)
    .setTimestamp();
}

function hasManageGuild(member) {
  return member?.permissions?.has?.(PermissionsBitField.Flags.ManageGuild) === true;
}

function toKeywords(words) {
  return words.map((w) => `*${w}*`);
}

async function getWords(db, guildId) {
  return (await db.get(wordsKey(guildId))) || [];
}

async function isGuildBlacklisted(db, guildId) {
  const active = (await db.get(`blguild_${guildId}`)) === true;
  if (!active) return false;
  const expiry = await db.get(`blguildtime_${guildId}`);
  return !isExpired(expiry);
}

async function isMaintenanceOn(db) {
  return (await db.get("maintenance_")) === true;
}

async function shouldEnforce(client, guildId) {
  const db = client.db;
  if ((await db.get(enabledKey(guildId))) !== true) return false;
  if (await isMaintenanceOn(db)) return false;
  if (await isGuildBlacklisted(db, guildId)) return false;
  return true;
}

async function syncRule(ctx, client, words) {
  const db = client.db;
  const guild = ctx.guild;
  const existingRuleId = await db.get(ruleIdKey(guild.id));

  try {
    if (existingRuleId) {
      const rule = await guild.autoModerationRules.fetch(existingRuleId).catch(() => null);
      if (rule) {
        await rule.setKeywordFilter(toKeywords(words));
        return { ok: true };
      }
      await db.delete(ruleIdKey(guild.id));
    }

    if (words.length === 0) return { ok: true };

    const rule = await guild.autoModerationRules.create({
      name: RULE_NAME,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.Keyword,
      triggerMetadata: { keywordFilter: toKeywords(words) },
      actions: [
        {
          type: AutoModerationActionType.BlockMessage,
          metadata: { customMessage: "Your message was blocked for containing a restricted word." },
        },
      ],
      enabled: true,
      reason: `Word moderation enabled by ${ctx.user.tag}`,
    });
    await db.set(ruleIdKey(guild.id), rule.id);
    return { ok: true };
  } catch (err) {
    console.error(`Failed to sync AutoMod word moderation rule in ${guild.id}:`, err);
    return { ok: false, message: "Discord rejected that update. Check the server's AutoMod rule limits and try again." };
  }
}

async function teardownWordMod(guild, client, reason) {
  const db = client.db;
  const ruleId = await db.get(ruleIdKey(guild.id));
  if (ruleId) {
    const rule = await guild.autoModerationRules.fetch(ruleId).catch(() => null);
    if (rule) await rule.delete(reason).catch(() => null);
  }
  cancelEnforcementTimer(guild.id);
  await db.delete(enabledKey(guild.id));
  await db.delete(ruleIdKey(guild.id));
  await db.delete(wordsKey(guild.id));
}

async function pauseOrResumeRule(client, guildId, active) {
  const db = client.db;
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const ruleId = await db.get(ruleIdKey(guildId));
  if (!ruleId) return;

  const rule = await guild.autoModerationRules.fetch(ruleId).catch(() => null);
  if (!rule || rule.enabled === active) return;

  const reason = active ? "Word moderation resumed" : "Word moderation paused";
  try {
    if (typeof rule.setEnabled === "function") {
      await rule.setEnabled(active, reason);
    } else {
      await rule.edit({ enabled: active, reason });
    }
  } catch (err) {
    console.error(`Failed to ${active ? "resume" : "pause"} word moderation in ${guildId}:`, err);
  }
}

async function syncEnforcement(client, guildId) {
  const db = client.db;
  cancelEnforcementTimer(guildId);

  if ((await db.get(enabledKey(guildId))) !== true) return;

  const active = await shouldEnforce(client, guildId);
  await pauseOrResumeRule(client, guildId, active);

  const blActive = (await db.get(`blguild_${guildId}`)) === true;
  if (blActive) {
    const blExpiry = await db.get(`blguildtime_${guildId}`);
    const blTs = typeof blExpiry === "number" ? blExpiry : parseInt(blExpiry, 10);
    if (!Number.isNaN(blTs) && blTs > Date.now()) {
      scheduleEnforcementCheck(client, guildId, blTs);
    }
  }
}

async function syncAllEnforcement(client) {
  const db = client.db;
  let all;
  try {
    all = await db.all();
  } catch (err) {
    console.error("Word moderation: failed to read db for syncAllEnforcement:", err);
    return;
  }

  const enabledGuildIds = all
    .filter((entry) => entry.id.startsWith("wordmodenabled_") && entry.value === true)
    .map((entry) => entry.id.slice("wordmodenabled_".length));

  for (const guildId of enabledGuildIds) {
    await syncEnforcement(client, guildId).catch((err) =>
      console.error(`syncAllEnforcement failed for guild ${guildId}:`, err),
    );
  }
}

function scheduleEnforcementCheck(client, guildId, atTimestamp) {
  if (enforcementTimers.has(guildId)) return;

  const remaining = Math.max(0, atTimestamp - Date.now());
  const delay = Math.min(remaining, MAX_TIMEOUT_MS);

  const timeout = setTimeout(async () => {
    enforcementTimers.delete(guildId);

    if (Date.now() < atTimestamp) {
      scheduleEnforcementCheck(client, guildId, atTimestamp);
      return;
    }

    try {
      await syncEnforcement(client, guildId);
    } catch (err) {
      console.error(`Enforcement check failed for guild ${guildId}:`, err);
    }
  }, delay);

  enforcementTimers.set(guildId, timeout);
}

function cancelEnforcementTimer(guildId) {
  const timeout = enforcementTimers.get(guildId);
  if (timeout) {
    clearTimeout(timeout);
    enforcementTimers.delete(guildId);
  }
}

module.exports = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("wordmod")
    .setDescription("Manage AutoMod-powered word moderation for this server.")
    .addSubcommand((sub) => sub.setName("enable").setDescription("Enable word moderation"))
    .addSubcommand((sub) => sub.setName("disable").setDescription("Disable word moderation"))
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a restricted word or phrase")
        .addStringOption((opt) => opt.setName("word").setDescription("Word or phrase to block").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a restricted word or phrase")
        .addStringOption((opt) => opt.setName("word").setDescription("Word or phrase to remove").setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("List all restricted words")),

  allowPrefix: true,

  async init(client) {
    await syncAllEnforcement(client);
  },

  syncEnforcement,
  syncAllEnforcement,

  async execute(ctx, client) {
    const db = client.db;
    const guild = ctx.guild;
    const sub = ctx.getSubcommand();

    if (!guild) return ctx.reply("This command can only be used in a server.");
    if (!hasManageGuild(ctx.member)) {
      return ctx.reply({ embeds: [errorEmbed("You need the **Manage Server** permission to use this.")] });
    }
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return ctx.reply({
        embeds: [errorEmbed("I need the **Manage Server** permission to manage AutoMod rules here.")],
      });
    }

    const wordInput = ctx.source === "slash" ? ctx.getString("word") : ctx.restText;

    if (sub === "enable") {
      const alreadyEnabled = (await db.get(enabledKey(guild.id))) === true;
      if (alreadyEnabled) {
        return ctx.reply({ embeds: [errorEmbed("Word moderation is already enabled.")] });
      }

      await db.set(enabledKey(guild.id), true);
      await syncEnforcement(client, guild.id);

      const embed = new EmbedBuilder()
        .setTitle("✅ Word Moderation Enabled")
        .setDescription(
          [
            "Restricted messages will now be blocked automatically via Discord AutoMod.",
            `Add up to **${MAX_WORDS}** words or phrases with ${client.mentionCommand("wordmod add")}.`,
            "This pauses automatically if the server is blacklisted or the bot enters maintenance - and resumes on its own once that clears.",
          ].join("\n"),
        )
        .setColor(0x57f287)
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }

    if (sub === "disable") {
      const enabled = (await db.get(enabledKey(guild.id))) === true;
      const ruleId = await db.get(ruleIdKey(guild.id));
      if (!enabled && !ruleId) {
        return ctx.reply({ embeds: [errorEmbed("Word moderation is not enabled.")] });
      }

      await teardownWordMod(guild, client, `Word moderation disabled by ${ctx.user.tag}`);

      return ctx.reply({
        embeds: [new EmbedBuilder().setTitle("🛑 Word Moderation Disabled").setColor(0xed4245).setTimestamp()],
      });
    }

    const enabled = (await db.get(enabledKey(guild.id))) === true;
    if (!enabled) {
      return ctx.reply({
        embeds: [errorEmbed(`Word moderation isn't enabled. Run ${client.mentionCommand("wordmod enable")} first.`)],
      });
    }

    if (sub === "list") {
      const words = await getWords(db, guild.id);
      const embed = new EmbedBuilder()
        .setTitle("📋 Restricted Words")
        .setDescription(words.length ? words.map((w, i) => `${i + 1}. \`${w}\``).join("\n") : "No words set yet.")
        .setFooter({ text: `${words.length}/${MAX_WORDS} used` })
        .setColor(0x5865f2)
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }

    if (sub === "add") {
      const word = wordInput?.trim().toLowerCase();
      if (!word) return ctx.reply({ embeds: [errorEmbed("Please specify a word or phrase to add.")] });
      if (word.length > MAX_WORD_LENGTH) {
        return ctx.reply({ embeds: [errorEmbed(`That word is too long - keep it under ${MAX_WORD_LENGTH} characters.`)] });
      }

      const words = await getWords(db, guild.id);
      if (words.includes(word)) return ctx.reply({ embeds: [errorEmbed(`\`${word}\` is already on the list.`)] });
      if (words.length >= MAX_WORDS) {
        return ctx.reply({ embeds: [errorEmbed(`You've hit the limit of **${MAX_WORDS}** words. Remove one first.`)] });
      }

      const updated = [...words, word];
      const result = await syncRule(ctx, client, updated);
      if (!result.ok) return ctx.reply({ embeds: [errorEmbed(result.message)] });

      await db.set(wordsKey(guild.id), updated);
      await syncEnforcement(client, guild.id);

      const embed = new EmbedBuilder()
        .setTitle("✅ Word Added")
        .setDescription(`\`${word}\` will now be blocked.`)
        .setFooter({ text: `${updated.length}/${MAX_WORDS} used` })
        .setColor(0x57f287)
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }

    if (sub === "remove") {
      const word = wordInput?.trim().toLowerCase();
      if (!word) return ctx.reply({ embeds: [errorEmbed("Please specify a word or phrase to remove.")] });

      const words = await getWords(db, guild.id);
      if (!words.includes(word)) return ctx.reply({ embeds: [errorEmbed(`\`${word}\` isn't on the list.`)] });

      const updated = words.filter((w) => w !== word);
      const result = await syncRule(ctx, client, updated);
      if (!result.ok) return ctx.reply({ embeds: [errorEmbed(result.message)] });

      await db.set(wordsKey(guild.id), updated);

      const embed = new EmbedBuilder()
        .setTitle("🗑️ Word Removed")
        .setDescription(`\`${word}\` will no longer be blocked.`)
        .setFooter({ text: `${updated.length}/${MAX_WORDS} used` })
        .setColor(0xed4245)
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }

    return ctx.reply("Usage: `wordmod enable|disable|add|remove|list`");
  },
};