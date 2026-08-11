const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const DISABLED_GUILDS = ["568902211980099605"];

module.exports = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete recent messages in this channel.")
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("How many messages to delete (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    ),

  aliases: ["prune", "bulkdelete"],
  allowPrefix: true,
  optionOrder: ["amount"],

  async execute(ctx, client) {
    if (DISABLED_GUILDS.includes(ctx.guild?.id)) {
      return ctx.reply("Mod commands are disabled in this server.");
    }

    const canModerate = ctx.raw.member?.permissions?.has(PermissionFlagsBits.ManageMessages);
    if (!canModerate) return ctx.reply("You can't do this!");

    const botCanManage = ctx.channel.permissionsFor(client.user)?.has(PermissionFlagsBits.ManageMessages);
    if (!botCanManage) return ctx.reply("I need the **Manage Messages** permission to do that.");

    const amount = ctx.getInteger("amount");
    if (!Number.isInteger(amount)) return ctx.reply("Please specify a valid number of messages to delete.");
    if (amount < 1) return ctx.reply("You can't delete less than 1 message!");
    if (amount > 100) return ctx.reply("You can delete a maximum of 100 messages!");

    const deleteCount = ctx.source === "slash" ? amount : amount + 1;

    let deleted;
    try {
      deleted = await ctx.channel.bulkDelete(deleteCount, true);
    } catch (err) {
      console.error("Purge failed:", err);
      return ctx.reply("Something went wrong while deleting messages.");
    }

    const actuallyDeleted = ctx.source === "slash" ? deleted.size : Math.max(deleted.size - 1, 0);

    const embed = new EmbedBuilder()
      .setTitle("🧹 Messages Purged")
      .setDescription(
        `Deleted **${actuallyDeleted}** message${actuallyDeleted === 1 ? "" : "s"} in ${ctx.channel}.` +
        (actuallyDeleted < amount ? "\n*Some messages were skipped - likely older than 14 days.*" : ""),
      )
      .setColor(0x57f287)
      .setFooter({ text: `Requested by ${ctx.user.tag}` })
      .setTimestamp();

    if (ctx.source === "slash") {
      return ctx.reply({ embeds: [embed], ephemeral: true });
    }

    const confirmation = await ctx.channel.send({ embeds: [embed] });
    setTimeout(() => confirmation?.delete?.().catch(() => { }), 2000);
  },
};