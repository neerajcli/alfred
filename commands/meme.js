const axios = require("axios");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

function randomColor() {
  return Math.floor(Math.random() * 0xffffff);
}

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder().setName("meme").setDescription("Have some fun with memes."),

  allowPrefix: true,

  async execute(ctx, client) {
    let data;
    try {
      const res = await axios.get("https://meme-api.com/gimme/dankmemes");
      data = res.data;
    } catch (err) {
      console.error("meme-api.com request failed:", err);
      return ctx.reply("Couldn't fetch a meme right now - try again in a bit.");
    }

    if (data.nsfw && !ctx.channel.nsfw) {
      return ctx.reply("🔞 That one came back NSFW - try again in an NSFW channel.");
    }

    const embed = new EmbedBuilder()
      .setTitle(data.title)
      .setURL(data.postLink)
      .setImage(data.url)
      .setColor(randomColor())
      .setFooter({
        text: `👍 ${data.ups} • r/${data.subreddit} • Requested by ${ctx.user.tag}`,
        iconURL: ctx.user.displayAvatarURL(),
      })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};