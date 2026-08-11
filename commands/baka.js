const { fetchNekosBestImage } = require("../utils/nekosBest");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const PHRASES = [
  "{author} calls {target} a baka!",
  "{target} got called a baka by {author}!",
  "Baka! {author} isn't holding back on {target}.",
];

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("baka")
    .setDescription("Call someone a baka!")
    .addUserOption((opt) => opt.setName("user").setDescription("Who to baka").setRequired(true)),

  allowPrefix: true,

  async execute(ctx, client) {
    const target = ctx.source === "slash" ? ctx.getUser("user") : ctx.raw.mentions.users.first();
    if (!target) return ctx.reply("🚫 Please mention a person to say baka to! 🚫");
    if (target.id === ctx.user.id) return ctx.reply(`${ctx.user.username}, don't do this :/`);
    if (target.bot) return ctx.reply("You can't baka a bot!");

    let imageUrl;
    try {
      imageUrl = await fetchNekosBestImage("baka");
    } catch (err) {
      console.error("nekos.best request failed:", err);
      return ctx.reply("Couldn't fetch a baka image right now - try again in a bit.");
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