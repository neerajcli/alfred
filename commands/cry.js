const { fetchNekosBestImage } = require("../utils/nekosBest");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder().setName("cry").setDescription("Cry about something."),

  allowPrefix: true,

  async execute(ctx, client) {
    let imageUrl;
    try {
      imageUrl = await fetchNekosBestImage("cry");
    } catch (err) {
      console.error("nekos.best request failed:", err);
      return ctx.reply("Couldn't fetch a cry image right now - try again in a bit.");
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${ctx.user.tag} cries!`, iconURL: ctx.user.displayAvatarURL() })
      .setImage(imageUrl)
      .setColor(0xff6b81)
      .setFooter({ text: `Requested by ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};