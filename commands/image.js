const axios = require("axios");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const SOURCES = {
  cat: {
    title: "🐱 Meow!",
    color: 0xf39c12,
    fetch: async () => {
      const res = await axios.get("https://api.thecatapi.com/v1/images/search", {
        params: { limit: 1, size: "full" },
      });
      return res.data[0].url;
    },
  },
  dog: {
    title: "🐶 Woof!",
    color: 0x3498db,
    fetch: async () => {
      const res = await axios.get("https://api.thedogapi.com/v1/images/search", {
        params: { limit: 1, size: "full" },
      });
      return res.data[0].url;
    },
  },
  food: {
    title: "🍽️ Yum!",
    color: 0x2ecc71,
    fetch: async () => {
      const res = await axios.get("https://www.themealdb.com/api/json/v1/1/random.php");
      return res.data.meals[0].strMealThumb;
    },
  },
  fox: {
    title: "🦊 Foxy!",
    color: 0xe67e22,
    fetch: async () => {
      const res = await axios.get("https://randomfox.ca/floof/");
      return res.data.image;
    },
  },
};

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("image")
    .setDescription("Get a random image.")
    .addSubcommand((sub) => sub.setName("cat").setDescription("Random cat image"))
    .addSubcommand((sub) => sub.setName("dog").setDescription("Random dog image"))
    .addSubcommand((sub) => sub.setName("food").setDescription("Random food image"))
    .addSubcommand((sub) => sub.setName("fox").setDescription("Random fox image")),

  allowPrefix: true,

  async execute(ctx, client) {
    const sub = ctx.getSubcommand();
    const source = SOURCES[sub];
    if (!source) return ctx.reply("Usage: `image cat|dog|food|fox`");

    let imageUrl;
    try {
      imageUrl = await source.fetch();
    } catch (err) {
      console.error(`${sub} image fetch failed:`, err);
      return ctx.reply("Couldn't fetch that image right now - try again in a bit.");
    }

    const embed = new EmbedBuilder()
      .setTitle(source.title)
      .setImage(imageUrl)
      .setColor(source.color)
      .setFooter({ text: `Requested by ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};