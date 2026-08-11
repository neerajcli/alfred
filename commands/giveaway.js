const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { parseDurationSpec, resolveDurationSpec } = require("../utils/time");

const ACTIVE_INDEX_KEY = "giveaway_active_ids";

const MAX_TIMEOUT_MS = 2147483647;

const activeTimeouts = new Map();

async function getActiveIds(client) {
  return (await client.db.get(ACTIVE_INDEX_KEY)) || [];
}

async function addActiveId(client, id) {
  const ids = await getActiveIds(client);
  if (!ids.includes(id)) {
    ids.push(id);
    await client.db.set(ACTIVE_INDEX_KEY, ids);
  }
}

async function removeActiveId(client, id) {
  const ids = await getActiveIds(client);
  const next = ids.filter((x) => x !== id);
  if (next.length !== ids.length) await client.db.set(ACTIVE_INDEX_KEY, next);
}

function enterButtonRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("giveaway:enter")
      .setLabel("🎉 Enter Giveaway")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
  );
}

function giveawayEmbed(g, { ended = false, winners = null } = {}) {
  const embed = new EmbedBuilder()
    .setTitle(ended ? "🎉 Giveaway Ended" : "🎉 Giveaway!")
    .addFields(
      { name: "Prize", value: g.prize, inline: false },
      { name: "Host", value: `<@${g.hostId}>`, inline: true },
      { name: "Winners", value: `${g.winnerCount}`, inline: true },
      { name: "Entries", value: `${g.entrants.length}`, inline: true },
      {
        name: ended ? "Ended" : "Ends",
        value: `<t:${Math.floor(g.endsAt / 1000)}:F> (<t:${Math.floor(g.endsAt / 1000)}:R>)`,
        inline: false,
      },
    )
    .setColor(ended ? 0x99aab5 : 0x57f287)
    .setTimestamp();

  if (ended) {
    embed.addFields({
      name: "Winner(s)",
      value: winners?.length ? winners.map((id) => `<@${id}>`).join(", ") : "No valid entries.",
    });
  } else {
    embed.setFooter({ text: "Click the button below to enter!" });
  }

  return embed;
}

async function endGiveaway(client, key, g) {
  g.ended = true;

  const count = Math.min(g.winnerCount, g.entrants.length);
  const pool = [...g.entrants];
  const winners = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  g.winners = winners;

  await client.db.set(key, g);
  await removeActiveId(client, g.messageId);
  cancelGiveawayTimer(g.messageId);

  try {
    const channel = await client.channels.fetch(g.channelId);
    const message = await channel.messages.fetch(g.messageId);
    await message.edit({ embeds: [giveawayEmbed(g, { ended: true, winners })], components: [enterButtonRow(true)] });

    await channel.send(
      winners.length
        ? `🎉 Congratulations ${winners.map((id) => `<@${id}>`).join(", ")}! You won **${g.prize}**!`
        : `😕 Nobody entered the giveaway for **${g.prize}** - no winner could be picked.`,
    );
  } catch (err) {
    console.error(`Failed to finalize giveaway ${key}:`, err);
  }
}

function scheduleGiveawayEnd(client, id, endsAt) {
  if (activeTimeouts.has(id)) return;

  const remaining = Math.max(0, endsAt - Date.now());
  const delay = Math.min(remaining, MAX_TIMEOUT_MS);

  const timeout = setTimeout(async () => {
    activeTimeouts.delete(id);

    if (Date.now() < endsAt) {
      scheduleGiveawayEnd(client, id, endsAt);
      return;
    }

    try {
      const key = `giveaway_${id}`;
      const g = await client.db.get(key);
      if (!g || g.ended) {
        await removeActiveId(client, id);
        return;
      }
      await endGiveaway(client, key, g);
    } catch (err) {
      console.error(`Failed to end giveaway ${id}:`, err);
    }
  }, delay);

  activeTimeouts.set(id, timeout);
}

function cancelGiveawayTimer(id) {
  const timeout = activeTimeouts.get(id);
  if (timeout) {
    clearTimeout(timeout);
    activeTimeouts.delete(id);
  }
}

module.exports = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Run a giveaway.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start a new giveaway")
        .addStringOption((opt) =>
          opt.setName("duration").setDescription("e.g. 30m, 24h, 7d").setRequired(true),
        )
        .addStringOption((opt) => opt.setName("prize").setDescription("What are you giving away?").setRequired(true))
        .addIntegerOption((opt) =>
          opt.setName("winners").setDescription("Number of winners (default 1)").setRequired(false).setMinValue(1),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("End a giveaway early")
        .addStringOption((opt) => opt.setName("message_id").setDescription("The giveaway's message ID").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("reroll")
        .setDescription("Pick new winner(s) for an ended giveaway")
        .addStringOption((opt) => opt.setName("message_id").setDescription("The giveaway's message ID").setRequired(true)),
    ),

  allowPrefix: true,

  async init(client) {
    const ids = await getActiveIds(client);

    for (const id of ids) {
      const g = await client.db.get(`giveaway_${id}`);
      if (!g || g.ended) {
        await removeActiveId(client, id);
        continue;
      }
      scheduleGiveawayEnd(client, id, g.endsAt);
    }
  },

  async execute(ctx, client) {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return ctx.reply("You need the Manage Server permission to manage giveaways.");
    }

    const sub = ctx.getSubcommand();

    if (sub === "start") {
      let durationInput, prize, winnerCount;

      if (ctx.source === "slash") {
        durationInput = ctx.getString("duration");
        prize = ctx.getString("prize");
        winnerCount = ctx.getInteger("winners") || 1;
      } else {
        const parts = (ctx.restText || "").split(/ +/).filter(Boolean);
        durationInput = parts[0];
        winnerCount = parseInt(parts[1], 10);
        prize = parts.slice(2).join(" ");
        if (!durationInput || !prize || !Number.isInteger(winnerCount) || winnerCount < 1) {
          return ctx.reply("Usage: `giveaway start <duration> <winner count> <prize>`");
        }
      }

      const spec = parseDurationSpec(durationInput);
      if (!spec || spec.type === "never") {
        return ctx.reply("Invalid duration. Try something like `30m`, `24h`, `7d`, or a date.");
      }
      const endsAt = resolveDurationSpec(spec);

      const g = {
        channelId: ctx.channel.id,
        guildId: ctx.guild.id,
        hostId: ctx.user.id,
        prize,
        winnerCount,
        endsAt,
        entrants: [],
        ended: false,
      };

      const sent = await ctx.channel.send({ embeds: [giveawayEmbed(g)], components: [enterButtonRow()] });
      g.messageId = sent.id;
      await client.db.set(`giveaway_${sent.id}`, g);
      await addActiveId(client, sent.id);
      scheduleGiveawayEnd(client, sent.id, endsAt);

      return ctx.reply(`🎉 Giveaway started for **${prize}**!`);
    }

    if (sub === "end" || sub === "reroll") {
      const messageId = ctx.source === "slash" ? ctx.getString("message_id") : ctx.restText?.trim().split(/ +/)[0];
      if (!messageId) return ctx.reply(`Usage: \`giveaway ${sub} <message id>\``);

      const key = `giveaway_${messageId}`;
      const g = await client.db.get(key);
      if (!g || g.guildId !== ctx.guild.id) return ctx.reply("Couldn't find a giveaway with that message ID.");

      if (sub === "end") {
        if (g.ended) return ctx.reply("That giveaway has already ended.");
        await endGiveaway(client, key, g);
        return ctx.reply("Giveaway ended.");
      }

      if (!g.ended) return ctx.reply("That giveaway hasn't ended yet.");
      await endGiveaway(client, key, g);
      return ctx.reply("Rerolled - new winner(s) picked.");
    }

    return ctx.reply("Usage: `giveaway start`, `giveaway end`, or `giveaway reroll`");
  },

  async handleButton(interaction, client) {
    if (interaction.customId !== "giveaway:enter") return;

    const key = `giveaway_${interaction.message.id}`;
    const g = await client.db.get(key);
    if (!g || g.ended) {
      return interaction.reply({ content: "This giveaway has ended.", flags: MessageFlags.Ephemeral });
    }

    const idx = g.entrants.indexOf(interaction.user.id);
    if (idx === -1) {
      g.entrants.push(interaction.user.id);
      await client.db.set(key, g);
      await interaction.reply({ content: "🎉 You're entered!", flags: MessageFlags.Ephemeral });
    } else {
      g.entrants.splice(idx, 1);
      await client.db.set(key, g);
      await interaction.reply({ content: "You've left the giveaway.", flags: MessageFlags.Ephemeral });
    }

    try {
      await interaction.message.edit({ embeds: [giveawayEmbed(g)], components: [enterButtonRow()] });
    } catch (err) {
      console.error("Failed to update giveaway entry count:", err);
    }
  },
};