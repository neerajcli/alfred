const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { requireUserPremium } = require("../utils/premium");
const { isExpired, formatExpiry } = require("../utils/time");

const COOLDOWN_MS = 365 * 24 * 60 * 60 * 1000;
const MAX_REWARD = 500000;

module.exports = {
  category: "User Premium",
  data: new SlashCommandBuilder().setName("yearly").setDescription("Get some money every 365 days."),

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

    const cooldownKey = "yearly_" + ctx.user.id;
    const lastClaim = await db.get(cooldownKey);
    if (lastClaim) {
      const cooldownExpiry = lastClaim + COOLDOWN_MS;
      if (!isExpired(cooldownExpiry)) {
        const embed = new EmbedBuilder()
          .setTitle("⏳ Cooldown Active")
          .setDescription(`You've already claimed your yearly reward.\nYou can claim again ${formatExpiry(cooldownExpiry)}.`)
          .setColor(0xed4245)
          .setTimestamp();
        return ctx.reply({ embeds: [embed] });
      }
    }

    const reward = Math.round(Math.random() * MAX_REWARD);
    await db.add("cash_" + ctx.user.id, reward);
    await db.set(cooldownKey, Date.now());

    const nextClaim = Date.now() + COOLDOWN_MS;

    const embed = new EmbedBuilder()
      .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
      .setTitle("🎉 Yearly Reward Claimed")
      .setDescription(`You received **$${reward.toLocaleString()}** from your yearly reward!`)
      .addFields({ name: "Next Claim", value: formatExpiry(nextClaim), inline: true })
      .setColor(0x57f287)
      .setThumbnail(ctx.user.displayAvatarURL())
      .setFooter({ text: "Premium perk - thanks for supporting the bot!" })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};