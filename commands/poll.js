const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");

const activeTimeouts = new Map();

const POLL_INDEX_KEY = "pollwatch_index";

const MAX_TIMEOUT_MS = 2147483647;

const MAX_ANSWERS = 10;
const MAX_ANSWER_LENGTH = 55;
const MAX_QUESTION_LENGTH = 300;
const MIN_DURATION_HOURS = 1;
const MAX_DURATION_HOURS = 768;
const DEFAULT_DURATION_HOURS = 24;

function toAnswers(rawOptions) {
  return rawOptions.slice(0, MAX_ANSWERS).map((text) => ({ text: text.slice(0, MAX_ANSWER_LENGTH) }));
}

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Start a native Discord poll in a channel.")
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Channel to post the poll in")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName("question").setDescription("The poll question").setRequired(true).setMaxLength(MAX_QUESTION_LENGTH),
    )
    .addStringOption((opt) =>
      opt.setName("options").setDescription("2-10 answers, separated by |  e.g. Yes | No | Maybe").setRequired(true),
    )
    .addIntegerOption((opt) =>
      opt
        .setName("duration")
        .setDescription(`How many hours the poll runs (${MIN_DURATION_HOURS}-${MAX_DURATION_HOURS}, default ${DEFAULT_DURATION_HOURS})`)
        .setMinValue(MIN_DURATION_HOURS)
        .setMaxValue(MAX_DURATION_HOURS),
    )
    .addBooleanOption((opt) => opt.setName("multiselect").setDescription("Allow picking more than one answer"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  allowPrefix: true,
  optionOrder: ["channel"],

  async execute(ctx, client) {
    if (!ctx.guild) return ctx.reply("This command can only be used in a server.");

    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return ctx.reply("You need the **Manage Channels** permission to start a poll.");
    }

    let targetChannel;
    let question;
    let rawOptions;
    let durationHours = DEFAULT_DURATION_HOURS;;
    let multiselect = false;

    if (ctx.source === "slash") {
      targetChannel = ctx.raw.options.getChannel("channel");
      question = ctx.getString("question")?.trim();
      rawOptions = (ctx.getString("options") || "").split("|").map((s) => s.trim()).filter(Boolean);
      durationHours = ctx.raw.options.getInteger("duration") ?? DEFAULT_DURATION_HOURS;
      multiselect = ctx.raw.options.getBoolean("multiselect") ?? false;
    } else {
      targetChannel = ctx.raw.mentions.channels.first();
      if (!targetChannel) {
        return ctx.reply(
          "Correct format: `poll #channel [duration:<hours>] [multi] <question> | <option1> | <option2> | ...`",
        );
      }

      const tokens = ctx.fullText
        .split(/\s+/)
        .filter(
          (token) =>
            token.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "") !==
            `<#${targetChannel.id}>`,
        );

      while (tokens.length) {
        const durationMatch = /^duration:(\d+)$/i.exec(tokens[0]);
        if (durationMatch) {
          const parsed = parseInt(durationMatch[1], 10);
          durationHours = Math.min(Math.max(parsed, MIN_DURATION_HOURS), MAX_DURATION_HOURS);
          tokens.shift();
          continue;
        }
        if (/^(multi|multiselect)$/i.test(tokens[0])) {
          multiselect = true;
          tokens.shift();
          continue;
        }
        break;
      }

      const parts = tokens.join(" ").split("|").map((s) => s.trim()).filter(Boolean);
      question = parts.shift();
      rawOptions = parts;
    }

    if (!targetChannel?.isTextBased?.()) {
      return ctx.reply("Please provide a valid text channel.");
    }
    if (!question) {
      return ctx.reply("Please provide a poll question.");
    }
    if (rawOptions.length < 2) {
      return ctx.reply("Please provide at least 2 answer options, separated by `|`.");
    }
    if (rawOptions.length > MAX_ANSWERS) {
      return ctx.reply(`Polls support a maximum of ${MAX_ANSWERS} answers.`);
    }

    const botPerms = targetChannel.permissionsFor(ctx.guild.members.me);
    if (!botPerms?.has(PermissionFlagsBits.SendMessages) || !botPerms?.has(PermissionFlagsBits.ViewChannel)) {
      return ctx.reply(`I don't have permission to send messages in ${targetChannel}.`);
    }

    let pollMessage;
    try {
      pollMessage = await targetChannel.send({
        poll: {
          question: { text: question.slice(0, MAX_QUESTION_LENGTH) },
          answers: toAnswers(rawOptions),
          duration: durationHours,
          allowMultiselect: multiselect,
        },
      });
    } catch (err) {
      console.error("Failed to create poll:", err);
      return ctx.reply("Something went wrong creating the poll - double check the channel and try again.");
    }

    const expiresAt = Date.now() + durationHours * 60 * 60 * 1000;
    const pollData = { channelId: targetChannel.id, question, expiresAt };

    await client.db.set(`pollwatch_${pollMessage.id}`, pollData);
    await client.db.push(POLL_INDEX_KEY, pollMessage.id);
    schedulePollEnd(client, pollMessage.id, pollData);

    const confirmEmbed = new EmbedBuilder()
      .setTitle("📊 Poll Started")
      .setDescription(`Your poll has been posted in ${targetChannel}.`)
      .addFields(
        { name: "Question", value: question },
        { name: "Answers", value: rawOptions.map((o) => `• ${o}`).join("\n") },
        { name: "Duration", value: `${durationHours}h`, inline: true },
        { name: "Multiple choice", value: multiselect ? "Yes" : "No", inline: true },
      )
      .setColor(0x5865f2)
      .setTimestamp();

    return ctx.reply({ embeds: [confirmEmbed] });
  },

  async init(client) {
    const ids = (await client.db.get(POLL_INDEX_KEY)) || [];

    for (const messageId of ids) {
      const value = await client.db.get(`pollwatch_${messageId}`);
      if (!value) {
        await client.db.pull(POLL_INDEX_KEY, messageId);
        continue;
      }
      schedulePollEnd(client, messageId, value);
    }
  },
};

function schedulePollEnd(client, messageId, value) {
  if (activeTimeouts.has(messageId)) return;

  const remaining = Math.max(0, value.expiresAt - Date.now());
  const delay = Math.min(remaining, MAX_TIMEOUT_MS);

  const timeout = setTimeout(async () => {
    activeTimeouts.delete(messageId);

    if (Date.now() < value.expiresAt) {
      schedulePollEnd(client, messageId, value);
      return;
    }

    try {
      await announceResults(client, messageId, value);
    } catch (err) {
      console.error(`Failed to announce results for poll ${messageId}:`, err);
    } finally {
      await client.db.delete(`pollwatch_${messageId}`);
      await client.db.pull(POLL_INDEX_KEY, messageId);
    }
  }, delay);

  activeTimeouts.set(messageId, timeout);
}

async function announceResults(client, messageId, { channelId, question }) {
  const channel = client.channels.cache.get(channelId) || (await client.channels.fetch(channelId).catch(() => null));
  if (!channel) return;

  const pollMessage = await channel.messages.fetch(messageId).catch(() => null);
  if (!pollMessage?.poll) return;

  const answers = [...pollMessage.poll.answers.values()].sort((a, b) => b.voteCount - a.voteCount);
  const topVotes = answers[0]?.voteCount ?? 0;
  const winners = topVotes > 0 ? answers.filter((a) => a.voteCount === topVotes) : [];

  const resultsText =
    answers.map((a) => `**${a.text}** - ${a.voteCount} vote${a.voteCount !== 1 ? "s" : ""}`).join("\n") ||
    "No votes were cast.";

  const embed = new EmbedBuilder()
    .setTitle("📊 Poll Results")
    .setDescription(`**${question}**\n\n${resultsText}`)
    .addFields({
      name: winners.length > 1 ? "Tie between" : "Winner",
      value: winners.length ? winners.map((w) => w.text).join(", ") : "No one voted, so no winner.",
    })
    .setColor(0x57f287)
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch((err) => console.error("Failed to post poll results:", err));
}