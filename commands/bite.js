const { fetchNekosBestImage } = require("../utils/nekosBest");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("bite")
    .setDescription("Bite someone.")
    .addUserOption((opt) => opt.setName("user").setDescription("Who to bite").setRequired(true)),

  allowPrefix: true,

  async execute(ctx, client) {
    const target = ctx.source === "slash" ? ctx.getUser("user") : ctx.raw.mentions.users.first();
    if (!target) return ctx.reply("🚫 Please mention a person to bite! 🚫");
    if (target.id === ctx.user.id) return ctx.reply(`${ctx.user.username}, let's not do this :/`);

    let imageUrl;
    try {
      imageUrl = await fetchNekosBestImage("bite");
    } catch (err) {
      console.error("nekos.best request failed:", err);
      return ctx.reply("Couldn't fetch a bite image right now - try again in a bit.");
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${ctx.user.username} bites ${target.username}!`, iconURL: ctx.user.displayAvatarURL() })
      .setImage(imageUrl)
      .setColor(0xff6b81)
      .setFooter({ text: `Requested by ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};