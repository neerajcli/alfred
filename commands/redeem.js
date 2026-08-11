const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("redeem")
    .setDescription("Check your (or someone else's) redeems.")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Whose redeems to check").setRequired(false),
    ),

  allowPrefix: true,

  async execute(ctx, client) {
    const db = client.db;

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(`Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`);
    }

    const target = ctx.source === "slash" ? ctx.getUser("user") || ctx.user : ctx.raw.mentions.users.first() || ctx.user;

    let redeem = await db.get(`redeem_${target.id}`);
    if (redeem === null || redeem === undefined) {
      redeem = 0;
      await db.set(`redeem_${target.id}`, 0);
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
      .setTitle(`🎟️ ${target.username}'s Redeems: ${redeem.toLocaleString()}`)
      .setThumbnail(target.displayAvatarURL())
      .setDescription(
        "Redeems are a special currency - cash them in for $20,000 each, or gift them to someone else.",
      )
      .addFields(
        { name: "useredeem", value: "Use a redeem and get $20,000!", inline: true },
        { name: "give redeem", value: "Give some of your redeems to someone!", inline: true },
      )
      .setColor(0x9b59b6)
      .setFooter({
        text: `Requested by ${ctx.user.tag} • Buy redeems from the shop, or donate to get them: 1$ = 2 redeems`,
      })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};