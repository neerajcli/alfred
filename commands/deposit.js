const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Deposit money from your cash into your bank.")
    .addStringOption((opt) =>
      opt.setName("amount").setDescription("Amount to deposit, or 'all'").setRequired(true),
    ),

  aliases: ["dep"],
  allowPrefix: true,
  optionOrder: ["amount"],

  async execute(ctx, client) {
    const db = client.db;

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    let cash = await db.get(`cash_${ctx.user.id}`);
    if (cash === null) {
      cash = 0;
      await db.set(`cash_${ctx.user.id}`, 0);
    }

    let bank = await db.get(`bank_${ctx.user.id}`);
    if (bank === null) {
      bank = 0;
      await db.set(`bank_${ctx.user.id}`, 0);
    }

    const rawAmount = ctx.getString("amount");
    const toDeposit = rawAmount?.toLowerCase() === "all" ? cash : Number(rawAmount);

    if (!rawAmount || Number.isNaN(toDeposit)) {
      return ctx.reply("Format is `/deposit amount:<amount|all>` or `a!deposit <amount|all>`.");
    }
    if (toDeposit <= 0) return ctx.reply("You can't deposit 0 or less.");
    if (toDeposit > cash) return ctx.reply("You can't deposit more than you have in cash.");

    await db.add(`bank_${ctx.user.id}`, toDeposit);
    await db.sub(`cash_${ctx.user.id}`, toDeposit);

    const embed = new EmbedBuilder()
      .setTitle("💰 Deposit Successful")
      .setDescription(`You deposited **$${toDeposit.toLocaleString()}** into your bank.`)
      .addFields(
        { name: "Cash", value: `$${(cash - toDeposit).toLocaleString()}`, inline: true },
        { name: "Bank", value: `$${(bank + toDeposit).toLocaleString()}`, inline: true },
      )
      .setColor(0x57f287)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};