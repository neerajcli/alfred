const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isExpired, formatExpiry } = require("../utils/time");

const TARGET_CHANNEL_ID = "1478012706731851847";
const MAX_FEEDBACK_LENGTH = 1000;
const COOLDOWN_MS = 5 * 60 * 1000;

async function fetchFeedbackChannel(client) {
  return (
    client.channels.cache.get(TARGET_CHANNEL_ID) ||
    (await client.channels.fetch(TARGET_CHANNEL_ID).catch(() => null))
  );
}

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("Give feedback for the bot.")
    .addStringOption((opt) => opt.setName("message").setDescription("Your feedback").setRequired(true)),

  allowPrefix: true,
  optionOrder: ["message"],

  async execute(ctx, client) {
    const feedback = (ctx.source === "slash" ? ctx.getString("message") : ctx.fullText)?.trim();
    if (!feedback) return ctx.reply("Please specify a feedback message!");
    if (feedback.length > MAX_FEEDBACK_LENGTH) {
      return ctx.reply(`Feedback can't be longer than ${MAX_FEEDBACK_LENGTH} characters.`);
    }

    const cooldownKey = `feedbackcooldown_${ctx.user.id}`;
    const lastSent = await client.db.get(cooldownKey);
    if (lastSent) {
      const cooldownExpiry = lastSent + COOLDOWN_MS;
      if (!isExpired(cooldownExpiry)) {
        return ctx.reply(`Please wait until ${formatExpiry(cooldownExpiry)} before sending more feedback.`);
      }
    }

    const channel = await fetchFeedbackChannel(client);
    if (!channel) return ctx.reply("A critical error occurred. Please contact developers.");

    const embed = new EmbedBuilder()
      .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
      .setTitle("💬 New Feedback")
      .setDescription(feedback)
      .setColor(0x5865f2)
      .setFooter({ text: `Sent by ${ctx.user.tag} (${ctx.user.id})` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await client.db.set(cooldownKey, Date.now());

    return ctx.reply("Your feedback has been submitted - thank you!");
  },
};