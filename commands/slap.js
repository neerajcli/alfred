const { fetchNekosBestImage } = require("../utils/nekosBest");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const PHRASES = [
  "{author} slaps {target}!",
  "{target} got a slap from {author}!",
];

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("slap")
    .setDescription("Slap someone.")
    .addUserOption((opt) => opt.setName("user").setDescription("Who to slap").setRequired(true)),

  allowPrefix: true,

  async execute(ctx, client) {
    const target = ctx.source === "slash" ? ctx.getUser("user") : ctx.raw.mentions.users.first();
    if (!target) return ctx.reply("🚫 Please mention a person to slap! 🚫");
    if (target.id === ctx.user.id) return ctx.reply(`${ctx.user.username}, let's not do this :/`);

    let imageUrl;
    try {
      imageUrl = await fetchNekosBestImage("slap");
    } catch (err) {
      console.error("nekos.best request failed:", err);
      return ctx.reply("Couldn't fetch a slap image right now - try again in a bit.");
    }

    const key = "slaps_" + ctx.user.id + target.id;
    await client.db.add(key, 1);
    const count = await client.db.get(key);

    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)]
      .replace("{author}", ctx.user.username)
      .replace("{target}", target.username);

    const embed = new EmbedBuilder()
      .setAuthor({ name: phrase, iconURL: ctx.user.displayAvatarURL() })
      .setImage(imageUrl)
      .setColor(0xff6b81)
      .setFooter({ text: `${count} slap${count === 1 ? "" : "s"} between them! • Requested by ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};