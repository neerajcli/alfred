const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("prefix")
    .setDescription("Change this server's command prefix.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt.setName("new_prefix").setDescription("New prefix").setRequired(true),
    ),

  allowPrefix: true,

  async execute(ctx, client) {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return ctx.reply("You can't do this.");
    }

    const newPrefix = (ctx.source === "slash" ? ctx.getString("new_prefix") : ctx.fullText)?.trim();

    if (!newPrefix) {
      return ctx.reply("Usage: `prefix <new prefix>`");
    }
    if (/\s/.test(newPrefix)) {
      return ctx.reply("Prefix can't contain spaces.");
    }
    if (newPrefix.length > 5) {
      return ctx.reply("Prefix must be 5 characters or fewer.");
    }

    await client.db.set(`prefix_${ctx.guild.id}`, newPrefix);

    const embed = new EmbedBuilder()
      .setTitle("✅ Prefix Updated")
      .setDescription(`Changed this server's prefix to \`${newPrefix}\`.`)
      .setColor(0x57f287)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};