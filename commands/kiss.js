const { fetchNekosBestImage } = require("../utils/nekosBest");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const DISABLED_GUILD_ID = "568902211980099605";

const PHRASES = [
  "{author} kisses {target}!",
  "{target} got a kiss from {author}!",
];

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("kiss")
    .setDescription("Kiss someone.")
    .addUserOption((opt) => opt.setName("user").setDescription("Who to kiss").setRequired(true)),

  allowPrefix: true,

  async execute(ctx, client) {
    if (ctx.guild.id === DISABLED_GUILD_ID) {
      return ctx.reply("This command is disabled.");
    }

    const target = ctx.source === "slash" ? ctx.getUser("user") : ctx.raw.mentions.users.first();
    if (!target) return ctx.reply("🚫 Please mention a person to kiss! 🚫");
    if (target.id === ctx.user.id) {
      return ctx.reply(`${ctx.user.username}, looks like you are lonely... sad :/`);
    }

    let imageUrl;
    try {
      imageUrl = await fetchNekosBestImage("kiss");
    } catch (err) {
      console.error("nekos.best request failed:", err);
      return ctx.reply("Couldn't fetch a kiss image right now - try again in a bit.");
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