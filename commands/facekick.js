const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const { requireUserPremium } = require("../utils/premium");
const path = require("path");

const GIFS = [
  "facekick1.gif",
  "facekick2.gif",
  "facekick3.gif",
  "facekick4.gif",
  "facekick5.gif",
  "facekick6.gif",
  "facekick7.gif",
  "facekick8.gif",
  "facekick9.gif",
  "facekick10.gif",
  "facekick11.gif",
];

module.exports = {
  category: "User Premium",

  data: new SlashCommandBuilder()
    .setName("facekick")
    .setDescription("Kick someone in the face.")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("Who to facekick")
        .setRequired(true)
    ),

  allowPrefix: true,
  optionOrder: ["user"],

  async execute(ctx, client) {
    if (!(await requireUserPremium(ctx, client))) return;

    const target = ctx.getUser("user");

    if (!target) {
      return ctx.reply("🚫 Please mention a person to facekick! 🚫");
    }

    if (target.id === ctx.user.id) {
      return ctx.reply(`${ctx.user.username}, let's not do this :/`);
    }

    if (target.bot) {
      return ctx.reply("🚫 You can't facekick a bot! 🚫");
    }

    const filename = GIFS[Math.floor(Math.random() * GIFS.length)];

    const filePath = path.join(__dirname, "../assets", filename);

    const attachment = new AttachmentBuilder(filePath, {
      name: filename,
    });

    const embed = new EmbedBuilder()
      .setTitle(
        `${ctx.user.username} kicks ${target.username} in the face! Oops!`
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