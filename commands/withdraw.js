const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("Withdraw money from your bank into your cash.")
    .addStringOption((opt) =>
      opt.setName("amount").setDescription("Amount to withdraw, or 'all'").setRequired(true),
    ),

  aliases: ["with"],
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
    const toWithdraw = rawAmount?.toLowerCase() === "all" ? bank : Number(rawAmount);

    if (!rawAmount || Number.isNaN(toWithdraw)) {
      return ctx.reply("Format is `/withdraw amount:<amount|all>` or `a!withdraw <amount|all>`.");
    }
    if (toWithdraw <= 0) return ctx.reply("You can't withdraw 0 or less.");
    if (toWithdraw > bank) return ctx.reply("You can't withdraw more than you have in your bank.");

    await db.sub(`bank_${ctx.user.id}`, toWithdraw);
    await db.add(`cash_${ctx.user.id}`, toWithdraw);

    const embed = new EmbedBuilder()
      .setTitle("💵 Withdrawal Successful")
      .setDescription(`You withdrew **$${toWithdraw.toLocaleString()}** from your bank.`)
      .addFields(
        { name: "Cash", value: `$${(cash + toWithdraw).toLocaleString()}`, inline: true },
        { name: "Bank", value: `$${(bank - toWithdraw).toLocaleString()}`, inline: true },
      )
      .setColor(0x57f287)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};