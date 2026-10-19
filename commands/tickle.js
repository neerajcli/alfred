const { fetchNekosBestImage } = require("../utils/nekosBest");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const PHRASES = [
  "{author} tickles {target}!",
  "{target} got tickled by {author}!",
];

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("tickle")
    .setDescription("Tickle someone.")
    .addUserOption((opt) => opt.setName("user").setDescription("Who to tickle").setRequired(true)),

  allowPrefix: true,

  async execute(ctx, client) {
    const target = ctx.source === "slash" ? ctx.getUser("user") : ctx.raw.mentions.users.first();
    if (!target) return ctx.reply("🚫 Please mention a person to tickle! 🚫");
    if (target.id === ctx.user.id) {
      return ctx.reply(`${ctx.user.username}, looks like you need friends to tickle you... sad :/`);
    }

    let imageUrl;
    try {
      imageUrl = await fetchNekosBestImage("tickle");
    } catch (err) {
      console.error("nekos.best request failed:", err);
      return ctx.reply("Couldn't fetch a tickle image right now - try again in a bit.");
    }

    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)]
      .replace("{author}", ctx.user.username)
      .replace("{target}", target.username);

    const embed = new EmbedBuilder()
      .setAuthor({ name: phrase, iconURL: ctx.user.displayAvatarURL() })
      .setImage(imageUrl)
      .setColor(0xff6b81)
      .setFooter({ text: `Requested by ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};