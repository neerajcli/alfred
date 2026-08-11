const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const STATUS_URL = "https://alfredbot.statuspage.io/";

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder().setName("status").setDescription("Check the bot's status page."),

  allowPrefix: true,

  async execute(ctx, client) {
    const embed = new EmbedBuilder()
      .setTitle("📡 Bot Status")
      .setDescription("Check real-time uptime, incidents, and maintenance updates on the status page below.")
      .setColor(0x5865f2)
      .setThumbnail(client.user.displayAvatarURL())
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("View Status Page").setStyle(ButtonStyle.Link).setURL(STATUS_URL).setEmoji("🔗"),
    );

    return ctx.reply({ embeds: [embed], components: [row] });
  },
};