const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const { requireUserPremium } = require("../utils/premium");
const path = require("path");

const GIFS = [
  "slipper1.gif",
  "slipper2.gif",
  "slipper3.gif",
  "slipper4.gif",
  "slipper5.gif",
  "slipper6.gif",
  "slipper7.gif",
];

module.exports = {
  category: "User Premium",

  data: new SlashCommandBuilder()
    .setName("slipper")
    .setDescription("Hit someone with a slipper.")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("Who to hit")
        .setRequired(true)
    ),

  allowPrefix: true,
  optionOrder: ["user"],

  async execute(ctx, client) {
    if (!(await requireUserPremium(ctx, client))) return;

    const target = ctx.getUser("user");

    if (!target) {
      return ctx.reply(
        "🚫 Please mention a person to hit with a slipper! 🚫"
      );
    }

    if (target.id === ctx.user.id) {
      return ctx.reply(`${ctx.user.username}, let's not do this :/`);
    }

    if (target.bot) {
      return ctx.reply(
        "🚫 You can't hit a bot with a slipper! 🚫"
      );
    }

    const filename = GIFS[Math.floor(Math.random() * GIFS.length)];

    const filePath = path.join(__dirname, "../assets", filename);

    const attachment = new AttachmentBuilder(filePath, {
      name: filename,
    });

    const embed = new EmbedBuilder()
      .setTitle(
        `${ctx.user.username} hits ${target.username} with a slipper! Woops!`
      )
      .setImage(`attachment://${filename}`)
      .setColor(0x5865f2)
      .setTimestamp();

    return ctx.reply({
      embeds: [embed],
      files: [attachment],
    });
  },
};