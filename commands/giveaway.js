const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags,
  ChannelType,
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

async function resolveMember(guild, id) {
  try {
    const member = await guild.members.fetch(id);
    return member.toString();
  } catch {
    return `Unknown Member (${id})`;
  }
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

function giveawayEmbed(g, { ended = false, winnerMentions = null, hostMention = null } = {}) {
  const embed = new EmbedBuilder()
    .setTitle(ended ? "🎉 Giveaway Ended" : "🎉 Giveaway!")
    .addFields(
      { name: "Prize", value: g.prize, inline: false },
      { name: "Host", value: hostMention || g.hostId, inline: true },
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

  if (g.requirement) {
    embed.addFields({
      name: "Requirement",
      value: `Send \`${g.requirement.text}\` in <#${g.requirement.channelId}> to qualify before entering.`,
      inline: false,
    });
  }

  if (ended) {
    embed.addFields({
      name: "Winner(s)",
      value: winnerMentions?.length ? winnerMentions.join(", ") : "No valid entries.",
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
    const guild = await client.guilds.fetch(g.guildId);
    const hostMention = await resolveMember(guild, g.hostId);
    const winnerMentions = await Promise.all(winners.map((id) => resolveMember(guild, id)));

    const channel = await client.channels.fetch(g.channelId);
    const message = await channel.messages.fetch(g.messageId);
    await message.edit({
      embeds: [giveawayEmbed(g, { ended: true, winnerMentions, hostMention })],
      components: [enterButtonRow(true)],
    });

    await channel.send(
      winnerMentions.length
        ? `🎉 Congratulations ${winnerMentions.join(", ")}! You won **${g.prize}**!`
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

function parseChannelId(raw) {
  if (!raw) return null;
  const mentionMatch = raw.match(/^<#(\d+)>$/);
  if (mentionMatch) return mentionMatch[1];
  if (/^\d+$/.test(raw)) return raw;
  return null;
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
        )
        .addChannelOption((opt) =>
          opt
            .setName("req_channel")
            .setDescription("Channel entrants must send a message in before they can enter (optional)")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        )
        .addStringOption((opt) =>
          opt
            .setName("req_message")
            .setDescription("The message entrants must send before they can enter (optional)")
            .setRequired(false),
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
    )
    .addSubcommand((sub) =>
      sub
        .setName("participants")
        .setDescription("List everyone entered in a giveaway")
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
      let durationInput, prize, winnerCount, reqChannelId, reqMessage;

      if (ctx.source === "slash") {
        durationInput = ctx.getString("duration");
        prize = ctx.getString("prize");
        winnerCount = ctx.getInteger("winners") || 1;
        const reqChannelOpt = ctx.raw.options.getChannel("req_channel");
        reqChannelId = reqChannelOpt?.id || null;
        reqMessage = ctx.getString("req_message")?.trim() || null;
      } else {
        const body = ctx.restText || "";
        const [mainPart, ...reqParts] = body.split("|");

        const parts = mainPart.trim().split(/ +/).filter(Boolean);
        durationInput = parts[0];
        winnerCount = parseInt(parts[1], 10);
        prize = parts.slice(2).join(" ");

        if (!durationInput || !prize || !Number.isInteger(winnerCount) || winnerCount < 1) {
          return ctx.reply(
            "Usage: `giveaway start <duration> <winner count> <prize>` (optionally add `| <#channel> <requirement message>`)",
          );
        }

        if (reqParts.length) {
          const reqBody = reqParts.join("|").trim().split(/ +/).filter(Boolean);
          reqChannelId = parseChannelId(reqBody[0]);
          reqMessage = reqBody.slice(1).join(" ").trim() || null;

          if (!reqChannelId || !reqMessage) {
            return ctx.reply(
              "Couldn't parse the requirement. Use: `... | <#channel> <requirement message>`",
            );
          }
        } else {
          reqChannelId = null;
          reqMessage = null;
        }
      }

      if (!!reqChannelId !== !!reqMessage) {
        return ctx.reply("To set an entry requirement, provide both `req_channel` and `req_message` together.");
      }

      let requirement = null;
      if (reqChannelId && reqMessage) {
        const reqChannel = await client.channels.fetch(reqChannelId).catch(() => null);
        if (!reqChannel || !reqChannel.isTextBased?.()) {
          return ctx.reply("`req_channel` doesn't look like a valid text channel in this server.");
        }
        requirement = { text: reqMessage, channelId: reqChannelId };
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
        requirement,
        qualifiedUsers: [],
        ended: false,
      };

      const sent = await ctx.channel.send({
        embeds: [giveawayEmbed(g, { hostMention: ctx.member.toString() })],
        components: [enterButtonRow()],
      });
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

    if (sub === "participants") {
      const messageId = ctx.source === "slash" ? ctx.getString("message_id") : ctx.restText?.trim().split(/ +/)[0];
      if (!messageId) return ctx.reply("Usage: `giveaway participants <message id>`");

      const key = `giveaway_${messageId}`;
      const g = await client.db.get(key);
      if (!g || g.guildId !== ctx.guild.id) return ctx.reply("Couldn't find a giveaway with that message ID.");

      if (!g.entrants.length) return ctx.reply(`No one has entered the giveaway for **${g.prize}** yet.`);

      const entrantMentions = await Promise.all(g.entrants.map((id) => resolveMember(ctx.guild, id)));

      const embed = new EmbedBuilder()
        .setTitle(`🎉 Entrants - ${g.prize}`)
        .setDescription(entrantMentions.map((mention, i) => `${i + 1}. ${mention}`).join("\n").slice(0, 4000))
        .setFooter({ text: `${g.entrants.length} total entrant${g.entrants.length === 1 ? "" : "s"}` })
        .setColor(0x57f287);

      return ctx.reply({ embeds: [embed] });
    }

    return ctx.reply("Usage: `giveaway start`, `giveaway end`, `giveaway reroll`, or `giveaway participants`");
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
      if (g.requirement && !(g.qualifiedUsers || []).includes(interaction.user.id)) {
        return interaction.reply({
          content: `You need to send \`${g.requirement.text}\` in <#${g.requirement.channelId}> before you can enter.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      g.entrants.push(interaction.user.id);
      await client.db.set(key, g);
      await interaction.reply({ content: "🎉 You're entered!", flags: MessageFlags.Ephemeral });
    } else {
      g.entrants.splice(idx, 1);
      await client.db.set(key, g);
      await interaction.reply({ content: "You've left the giveaway.", flags: MessageFlags.Ephemeral });
    }

    try {
      const hostMention = await resolveMember(interaction.guild, g.hostId);
      await interaction.message.edit({
        embeds: [giveawayEmbed(g, { hostMention })],
        components: [enterButtonRow()],
      });
    } catch (err) {
      console.error("Failed to update giveaway entry count:", err);
    }
  },

  async handleMessageCreate(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const ids = await getActiveIds(client);
    if (ids.length === 0) return;

    const text = message.content.trim();
    if (!text) return;

    for (const id of ids) {
      const key = `giveaway_${id}`;
      const g = await client.db.get(key);
      if (!g || g.ended) continue;
      if (!g.requirement) continue;
      if (g.requirement.channelId !== message.channel.id) continue;
      if (text.toLowerCase() !== g.requirement.text.toLowerCase()) continue;

      g.qualifiedUsers = g.qualifiedUsers || [];
      if (g.qualifiedUsers.includes(message.author.id)) continue;

      g.qualifiedUsers.push(message.author.id);
      await client.db.set(key, g);
    }
  },
};