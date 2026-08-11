const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const REDEEM_VALUE = 20000;

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder().setName("useredeem").setDescription(`Use a redeem to get $${REDEEM_VALUE}.`),

  allowPrefix: true,

  async execute(ctx, client) {
    const db = client.db;

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    let redeems = await db.get("redeem_" + ctx.user.id);
    if (redeems === null) {
      redeems = 0;
      await db.set("redeem_" + ctx.user.id, 0);
    }
    if (redeems <= 0) return ctx.reply("You don't have any available redeems!");

    await db.sub("redeem_" + ctx.user.id, 1);
    await db.add("cash_" + ctx.user.id, REDEEM_VALUE);

    const remaining = redeems - 1;
    const newCash = await db.get("cash_" + ctx.user.id);

    const embed = new EmbedBuilder()
      .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
      .setTitle("🎟️ Redeem Used")
      .setDescription(`You used a redeem and got **$${REDEEM_VALUE.toLocaleString()}**!`)
      .addFields(
        { name: "Redeems Remaining", value: `${remaining}`, inline: true },
        { name: "Cash Balance", value: `$${(newCash ?? 0).toLocaleString()}`, inline: true },
      )
      .setColor(0x5865f2)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};