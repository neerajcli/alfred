const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Check someone's avatar, or the server's icon.")
    .addSubcommand((sub) =>
      sub
        .setName("user")
        .setDescription("Check a user's avatar")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Whose avatar to show (defaults to you)").setRequired(false),
        ),
    )
    .addSubcommand((sub) => sub.setName("server").setDescription("Check this server's icon")),

  aliases: ["av"],
  allowPrefix: true,

  async execute(ctx, client) {
    const sub = ctx.getSubcommand();

    if (!["user", "server"].includes(sub)) {
      return ctx.reply("Usage: `avatar user [@user]` or `avatar server`");
    }

    if (sub === "server") {
      if (!ctx.guild.iconURL()) {
        return ctx.reply("This server doesn't have an icon set.");
      }

      const embed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setAuthor({ name: ctx.guild.name, iconURL: ctx.guild.iconURL() })
        .setImage(ctx.guild.iconURL({ size: 2048 }))
        .setFooter({ text: `Requested by: ${ctx.user.tag}` })
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    }

    const target =
      ctx.source === "slash" ? ctx.getUser("user") || ctx.user : ctx.raw.mentions.users.first() || ctx.user;

    const embed = new EmbedBuilder()
      .setColor(0x00ffff)
      .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
      .setImage(target.displayAvatarURL({ size: 2048 }))
      .setFooter({ text: `Requested by: ${ctx.user.tag}` })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};