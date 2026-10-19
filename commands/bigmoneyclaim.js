const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isExpired, formatExpiry } = require("../utils/time");

const COOLDOWN_MS = 60 * 60 * 1000;
const CLAIM_AMOUNT = 1000;

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("bigmoney-claim")
    .setDescription(`Claim your $${CLAIM_AMOUNT.toLocaleString()} if you own the BigMoney item.`),

  allowPrefix: true,

  async execute(ctx, client) {
    const db = client.db;

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    const ownsBigMoney = (await db.get(`big_${ctx.user.id}`)) === true;
    if (!ownsBigMoney) {
      const embed = new EmbedBuilder()
        .setTitle("❌ You Don't Own BigMoney")
        .setDescription(
          `You need to buy the **BigMoney** item from the shop before you can claim this reward.`,
        )
        .setColor(0xed4245)
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }

    const lastClaimKey = `bigmo_${ctx.user.id}`;
    const lastClaim = await db.get(lastClaimKey);
    if (lastClaim) {
      const cooldownExpiry = lastClaim + COOLDOWN_MS;
      if (!isExpired(cooldownExpiry)) {
        const embed = new EmbedBuilder()
          .setTitle("⏳ Cooldown Active")
          .setDescription(`You need to wait until ${formatExpiry(cooldownExpiry)} to claim your BigMoney reward again.`)
          .setColor(0xed4245)
          .setTimestamp();
        return ctx.reply({ embeds: [embed] });
      }
    }

    await db.set(lastClaimKey, Date.now());
    await db.add("cash_" + ctx.user.id, CLAIM_AMOUNT);

    const embed = new EmbedBuilder()
      .setTitle("💰 BigMoney Claimed")
      .setDescription(
        `You claimed your BigMoney reward and received **$${CLAIM_AMOUNT.toLocaleString()}**! Come back in an hour to claim it again.`,
      )
      .setColor(0x57f287)
      .setTimestamp();
    return ctx.reply({ embeds: [embed] });
  },
};