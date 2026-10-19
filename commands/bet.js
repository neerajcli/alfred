const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { requireUserPremium } = require("../utils/premium");
const { isExpired, formatExpiry } = require("../utils/time");

const COOLDOWN_MS = 30 * 60 * 1000;
const WIN_THRESHOLD = 3;

module.exports = {
  category: "User Premium",
  data: new SlashCommandBuilder()
    .setName("bet")
    .setDescription("Bet your cash for a chance to win extra.")
    .addIntegerOption((opt) =>
      opt.setName("amount").setDescription("Amount to bet").setRequired(true).setMinValue(1),
    ),

  allowPrefix: true,
  optionOrder: ["amount"],

  async execute(ctx, client) {
    const db = client.db;

    if (!(await requireUserPremium(ctx, client))) return;

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    const lastBet = await db.get(`bet_${ctx.user.id}`);
    if (lastBet) {
      const cooldownExpiry = lastBet + COOLDOWN_MS;
      if (!isExpired(cooldownExpiry)) {
        const embed = new EmbedBuilder()
          .setTitle("⏳ Cooldown Active")
          .setDescription(`You need to wait until ${formatExpiry(cooldownExpiry)} to bet again.`)
          .setColor(0xed4245)
          .setTimestamp();
        return ctx.reply({ embeds: [embed] });
      }
    }

    const betAmount = ctx.getInteger("amount");
    if (!Number.isInteger(betAmount)) return ctx.reply("Please specify a valid amount to bet.");
    if (betAmount <= 0) return ctx.reply("You can't bet nothing.");

    let cash = await db.get(`cash_${ctx.user.id}`);
    if (cash === null) {
      cash = 0;
      await db.set(`cash_${ctx.user.id}`, 0);
    }
    if (betAmount > cash) return ctx.reply("You can't bet more than you have in cash.");

    const roll = Math.round(Math.random() * 10);
    const won = roll <= WIN_THRESHOLD;

    if (won) {
      await db.add(`cash_${ctx.user.id}`, betAmount);
    } else {
      await db.sub(`cash_${ctx.user.id}`, betAmount);
    }
    await db.set(`bet_${ctx.user.id}`, Date.now());

    const newCash = await db.get(`cash_${ctx.user.id}`);

    const embed = new EmbedBuilder()
      .setTitle(won ? "🎲 You Won!" : "🎲 You Lost")
      .setDescription(
        won
          ? `You bet **$${betAmount.toLocaleString()}** and won an extra **$${betAmount.toLocaleString()}**!`
          : `You bet **$${betAmount.toLocaleString()}** and lost it. Better luck next time.`,
      )
      .addFields({ name: "Cash Balance", value: `$${(newCash ?? 0).toLocaleString()}`, inline: true })
      .setColor(won ? 0x57f287 : 0xed4245)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};