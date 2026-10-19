const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isExpired, formatExpiry } = require("../utils/time");

const COOLDOWN_MS = 3 * 60 * 60 * 1000;
const MAX_REWARD = 200;

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("beg")
    .setDescription("Do some begging and get some money."),

  allowPrefix: true,

  async execute(ctx, client) {
    const db = client.db;

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    const lastBeg = await db.get(`beg_${ctx.user.id}`);
    if (lastBeg) {
      const cooldownExpiry = lastBeg + COOLDOWN_MS;
      if (!isExpired(cooldownExpiry)) {
        const embed = new EmbedBuilder()
          .setTitle("⏳ Cooldown Active")
          .setDescription(`You need to wait until ${formatExpiry(cooldownExpiry)} to beg again.`)
          .setColor(0xed4245)
          .setTimestamp();
        return ctx.reply({ embeds: [embed] });
      }
    }

    const cash = await db.get(`cash_${ctx.user.id}`);
    if (cash === null) await db.set(`cash_${ctx.user.id}`, 0);

    const reward = Math.round(Math.random() * MAX_REWARD);
    await db.add(`cash_${ctx.user.id}`, reward);
    await db.set(`beg_${ctx.user.id}`, Date.now());

    const newCash = await db.get(`cash_${ctx.user.id}`);

    const embed = new EmbedBuilder()
      .setTitle("🙏 Begging Successful")
      .setDescription(`You begged a passerby and earned **$${reward.toLocaleString()}**!`)
      .addFields({ name: "Cash Balance", value: `$${(newCash ?? reward).toLocaleString()}`, inline: true })
      .setColor(0x57f287)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};