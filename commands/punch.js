const { fetchNekosBestImage } = require("../utils/nekosBest");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("punch")
    .setDescription("Punch someone.")
    .addUserOption((opt) => opt.setName("user").setDescription("Who to punch").setRequired(true)),

  allowPrefix: true,

  async execute(ctx, client) {
    const target = ctx.source === "slash" ? ctx.getUser("user") : ctx.raw.mentions.users.first();
    if (!target) return ctx.reply("🚫 Please mention a person to punch! 🚫");
    if (target.id === ctx.user.id) return ctx.reply(`${ctx.user.username}, let's not do this :/`);

    let imageUrl;
    try {
      imageUrl = await fetchNekosBestImage("punch");
    } catch (err) {
      console.error("nekos.best request failed:", err);
      return ctx.reply("Couldn't fetch a punch image right now - try again in a bit.");
    }

    const key = "punch_" + ctx.user.id + target.id;
    await client.db.add(key, 1);
    const count = await client.db.get(key);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${ctx.user.username} punches ${target.username}!`, iconURL: ctx.user.displayAvatarURL() })
      .setImage(imageUrl)
      .setColor(0xff6b81)
      .setFooter({ text: `${count} punch${count === 1 ? "" : "es"} between them! • Requested by ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};