const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const CURRENCIES = {
  money: {
    dbKey: "cash_",
    label: "Cash",
    format: (n) => `$${n.toLocaleString()}`,
    emoji: "💸",
    color: 0x57f287,
  },
  redeem: {
    dbKey: "redeem_",
    label: "Redeems",
    format: (n) => `${n.toLocaleString()} redeem${n === 1 ? "" : "s"}`,
    emoji: "🎟️",
    color: 0x5865f2,
  },
};

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("give")
    .setDescription("Give some of your cash or redeems to another person.")
    .addSubcommand((sub) =>
      sub
        .setName("money")
        .setDescription("Give some of your cash to another person")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to give money to").setRequired(true))
        .addIntegerOption((opt) =>
          opt.setName("amount").setDescription("Amount to give").setRequired(true).setMinValue(1),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("redeem")
        .setDescription("Give some of your redeems to another person")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to give redeems to").setRequired(true))
        .addIntegerOption((opt) =>
          opt.setName("amount").setDescription("Amount to give").setRequired(true).setMinValue(1),
        ),
    ),

  allowPrefix: true,
  optionOrder: ["_subcommand", "user", "amount"],

  async execute(ctx, client) {
    const db = client.db;

    const sub = ctx.getSubcommand();
    const currency = CURRENCIES[sub];
    if (!currency) {
      return ctx.reply("Usage: `give money <user> <amount>` or `give redeem <user> <amount>`");
    }

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    const target = ctx.getUser("user");
    if (!target) return ctx.reply("Invalid user!");
    if (target.id === ctx.user.id) return ctx.reply(`You can't give yourself ${currency.label.toLowerCase()}!`);
    if (target.bot) return ctx.reply(`You can't give ${currency.label.toLowerCase()} to a bot!`);

    const toGive = ctx.getInteger("amount");
    if (!Number.isInteger(toGive)) return ctx.reply("Please specify a valid amount to give.");
    if (toGive <= 0) return ctx.reply(`You can't give 0 or less ${currency.label.toLowerCase()}.`);

    const balKey = currency.dbKey + ctx.user.id;
    let giverBal = await db.get(balKey);
    if (giverBal === null) {
      giverBal = 0;
      await db.set(balKey, 0);
    }

    if (toGive > giverBal) return ctx.reply(`You don't have enough ${currency.label.toLowerCase()} to give!`);

    const receiverKey = currency.dbKey + target.id;
    const receiverBal = await db.get(receiverKey);
    if (receiverBal === null) await db.set(receiverKey, 0);

    await db.sub(balKey, toGive);
    await db.add(receiverKey, toGive);

    const newGiverBal = await db.get(balKey);

    const embed = new EmbedBuilder()
      .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
      .setTitle(`${currency.emoji} ${currency.label} Sent`)
      .setDescription(`You gave **${target}** **${currency.format(toGive)}**!`)
      .addFields({ name: "Your Remaining Balance", value: currency.format(newGiverBal ?? 0), inline: true })
      .setThumbnail(target.displayAvatarURL())
      .setColor(currency.color)
      .setFooter({ text: `To: ${target.tag}` })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};