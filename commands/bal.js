const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { formatExpiry } = require("../utils/time");

const INFINITE_BALANCE_ID = "670234327749099521";

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your (or someone else's) balance.")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Whose balance to check").setRequired(false),
    ),

  aliases: ["bal"],
  allowPrefix: true,

  async execute(ctx, client) {
    const db = client.db;

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply("Please create your bank password using the `reset-pass` command to use this command.");
    }

    const target = ctx.source === "slash" ? ctx.getUser("user") || ctx.user : ctx.raw.mentions.users.first() || ctx.user;

    let cash = await db.get(`cash_${target.id}`);
    if (cash === null || cash === undefined) {
      cash = 0;
      await db.set(`cash_${target.id}`, 0);
    }

    let bank = await db.get(`bank_${target.id}`);
    if (bank === null || bank === undefined) {
      bank = 0;
      await db.set(`bank_${target.id}`, 0);
    }

    let networth = cash + bank;

    let cashDisplay = `$${cash.toLocaleString()}`;
    let bankDisplay = `$${bank.toLocaleString()}`;
    let networthDisplay = `$${networth.toLocaleString()}`;
    if (target.id === INFINITE_BALANCE_ID) {
      cashDisplay = bankDisplay = networthDisplay = "∞ Infinity";
    }

    const coinOwned = await db.get(`coin_${target.id}`);
    const coinDisplay = coinOwned === true ? "✅ Owned" : "❌ Not Owned";

    const isPremium = (await db.get("userpremium_" + target.id)) === true;
    let premiumDisplay = "❌ No";
    if (isPremium) {
      const storedExpiry = await db.get("userpremiumtime_" + target.id);
      premiumDisplay =
        storedExpiry === "never" || storedExpiry == null
          ? "✅ Yes (Permanent)"
          : `✅ Yes (expires ${formatExpiry(storedExpiry)})`;
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
      .setTitle(`💰 Balance — ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "Cash", value: cashDisplay, inline: true },
        { name: "Bank", value: bankDisplay, inline: true },
        { name: "Net Worth", value: networthDisplay, inline: true },
        { name: "Alfred Coin", value: coinDisplay, inline: true },
        { name: "Premium Member", value: premiumDisplay, inline: true },
      )
      .setColor(0xf1c40f)
      .setFooter({ text: `Requested by ${ctx.user.tag}` })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};