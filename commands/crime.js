const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isExpired, formatExpiry } = require("../utils/time");

const COOLDOWN_MS = 3 * 60 * 60 * 1000;
const MAX_REWARD = 200;
const SUCCESS_THRESHOLD = 6;

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("crime")
    .setDescription("Do some crime and get some money (or get caught)."),

  allowPrefix: true,

  async execute(ctx, client) {
    const db = client.db;

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    const lastCrime = await db.get(`crime_${ctx.user.id}`);
    if (lastCrime) {
      const cooldownExpiry = lastCrime + COOLDOWN_MS;
      if (!isExpired(cooldownExpiry)) {
        const embed = new EmbedBuilder()
          .setTitle("⏳ Cooldown Active")
          .setDescription(`You need to wait until ${formatExpiry(cooldownExpiry)} to try crime again.`)
          .setColor(0xed4245)
          .setTimestamp();
        return ctx.reply({ embeds: [embed] });
      }
    }

    let cash = await db.get(`cash_${ctx.user.id}`);
    if (cash === null) {
      cash = 0;
      await db.set(`cash_${ctx.user.id}`, 0);
    }

    const roll = Math.round(Math.random() * 10);
    const succeeded = roll <= SUCCESS_THRESHOLD;

    await db.set(`crime_${ctx.user.id}`, Date.now());

    if (succeeded) {
      const reward = Math.round(Math.random() * MAX_REWARD);
      await db.add(`cash_${ctx.user.id}`, reward);
      const newCash = await db.get(`cash_${ctx.user.id}`);

      const embed = new EmbedBuilder()
        .setTitle("🕵️ Crime Successful")
        .setDescription(`You broke into a shop and stole **$${reward.toLocaleString()}**!`)
        .addFields({ name: "Cash Balance", value: `$${(newCash ?? reward).toLocaleString()}`, inline: true })
        .setColor(0x57f287)
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }

    let bank = await db.get(`bank_${ctx.user.id}`);
    if (bank === null) {
      bank = 0;
      await db.set(`bank_${ctx.user.id}`, 0);
    }

    const netWorth = cash + bank;
    const fine = Math.round(Math.random() * netWorth * 0.1);

    if (fine > 0) await db.sub(`cash_${ctx.user.id}`, fine);
    const newCash = await db.get(`cash_${ctx.user.id}`);

    const embed = new EmbedBuilder()
      .setTitle("🚨 Caught!")
      .setDescription(
        fine > 0
          ? `You broke into a shop but got caught and were fined **$${fine.toLocaleString()}**.`
          : "You broke into a shop but got caught! Luckily, you had nothing worth fining.",
      )
      .addFields({ name: "Cash Balance", value: `$${(newCash ?? 0).toLocaleString()}`, inline: true })
      .setColor(0xed4245)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};