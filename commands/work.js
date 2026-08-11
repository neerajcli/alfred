const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isExpired, formatExpiry } = require("../utils/time");

const COOLDOWN_MS = 3 * 60 * 60 * 1000;
const MAX_REWARD = 300;

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder().setName("work").setDescription("Do some work and earn some money."),

  allowPrefix: true,

  async execute(ctx, client) {
    const db = client.db;

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    const cooldownKey = "work_" + ctx.user.id;
    const lastWorked = await db.get(cooldownKey);
    if (lastWorked) {
      const cooldownExpiry = lastWorked + COOLDOWN_MS;
      if (!isExpired(cooldownExpiry)) {
        const embed = new EmbedBuilder()
          .setTitle("⏳ Cooldown Active")
          .setDescription(`You need to wait until ${formatExpiry(cooldownExpiry)} to work again.`)
          .setColor(0xed4245)
          .setTimestamp();
        return ctx.reply({ embeds: [embed] });
      }
    }

    let cash = await db.get("cash_" + ctx.user.id);
    if (cash === null) {
      cash = 0;
      await db.set("cash_" + ctx.user.id, 0);
    }

    const earned = Math.round(Math.random() * MAX_REWARD);
    await db.add("cash_" + ctx.user.id, earned);
    await db.set(cooldownKey, Date.now());

    const newCash = await db.get("cash_" + ctx.user.id);

    const embed = new EmbedBuilder()
      .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
      .setTitle("💼 Work Complete")
      .setDescription(`You worked at a company and earned **$${earned.toLocaleString()}**!`)
      .addFields({ name: "Cash Balance", value: `$${(newCash ?? 0).toLocaleString()}`, inline: true })
      .setColor(0x57f287)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};