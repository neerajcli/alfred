const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

function formatDuration(ms) {
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (days > 0) return `${days}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m`;
  return "less than a minute";
}

module.exports = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Manage your AFK status.")
    .addSubcommand((sub) =>
      sub
        .setName("on")
        .setDescription("Turn on AFK")
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason for going AFK").setRequired(false),
        ),
    )
    .addSubcommand((sub) => sub.setName("off").setDescription("Turn off AFK")),

  allowPrefix: true,

  async execute(ctx, client) {
    const db = client.db;
    const key = "afk_" + ctx.user.id;
    const reasonKey = "afkreason_" + ctx.user.id;
    const sinceKey = "afksince_" + ctx.user.id;

    const sub = ctx.getSubcommand();
    const isAfk = (await db.get(key)) === true;

    const reasonInput = ctx.source === "slash" ? ctx.getString("reason") : ctx.restText;
    const reason = reasonInput?.trim() || "No Reason Provided";

    const turnOn = async () => {
      await db.set(key, true);
      await db.set(reasonKey, reason);
      await db.set(sinceKey, Date.now());

      const embed = new EmbedBuilder()
        .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
        .setTitle("🌙 AFK Enabled")
        .setDescription(`You're now marked as AFK. Mentions will let people know why you're away.`)
        .addFields({ name: "Reason", value: reason })
        .setColor(0xfee75c)
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    };

    const turnOff = async () => {
      const since = await db.get(sinceKey);
      const duration = since ? formatDuration(Date.now() - since) : null;

      await db.delete(key);
      await db.delete(reasonKey);
      await db.delete(sinceKey);

      const embed = new EmbedBuilder()
        .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
        .setTitle("☀️ Welcome Back!")
        .setDescription("Your AFK status has been turned off.")
        .setColor(0x57f287)
        .setTimestamp();

      if (duration) embed.addFields({ name: "You were away for", value: duration });

      return ctx.reply({ embeds: [embed] });
    };

    if (sub === "on") {
      if (isAfk) return ctx.reply("You are already AFK!");
      return turnOn();
    }

    if (sub === "off") {
      if (!isAfk) return ctx.reply("You are not AFK!");
      return turnOff();
    }

    return ctx.reply("Usage: `afk on [reason]` or `afk off`");
  },
};