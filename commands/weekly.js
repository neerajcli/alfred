const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { requireUserPremium } = require("../utils/premium");
const { isExpired, formatExpiry } = require("../utils/time");

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_REWARD = 10000;

module.exports = {
  category: "User Premium",
  data: new SlashCommandBuilder().setName("weekly").setDescription("Get some money every week."),

  allowPrefix: true,

  async execute(ctx, client) {
    const db = client.db;

    if (!(await requireUserPremium(ctx, client))) return;

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    const lastClaim = await db.get(`weekly_${ctx.user.id}`);
    if (lastClaim) {
      const cooldownExpiry = lastClaim + COOLDOWN_MS;
      if (!isExpired(cooldownExpiry)) {
        const embed = new EmbedBuilder()
          .setTitle("⏳ Cooldown Active")
          .setDescription(`You've already claimed this week's reward. You can claim again ${formatExpiry(cooldownExpiry)}.`)
          .setColor(0xed4245)
          .setTimestamp();
        return ctx.reply({ embeds: [embed] });
      }
    }

    const reward = Math.round(Math.random() * MAX_REWARD);
    await db.add(`cash_${ctx.user.id}`, reward);
    await db.set(`weekly_${ctx.user.id}`, Date.now());

    const newCash = await db.get(`cash_${ctx.user.id}`);

    const embed = new EmbedBuilder()
      .setTitle("🎉 Weekly Reward Claimed")
      .setDescription(`You received **$${reward.toLocaleString()}** as your weekly premium reward! Come back in 7 days for more.`)
      .addFields({ name: "Cash Balance", value: `$${(newCash ?? reward).toLocaleString()}`, inline: true })
      .setColor(0x57f287)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};