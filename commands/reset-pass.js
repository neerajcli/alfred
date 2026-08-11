const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generatePassword(length) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += PASSWORD_CHARS.charAt(Math.floor(Math.random() * PASSWORD_CHARS.length));
  }
  return result;
}

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("reset-pass")
    .setDescription("Reset your bank password."),

  aliases: ["resetbankpass"],
  allowPrefix: true,

  async execute(ctx, client) {
    const newPassword = generatePassword(12);
    await client.db.set("econpass_" + ctx.user.id, newPassword);

    const dmEmbed = new EmbedBuilder()
      .setTitle("🔐 Bank Password Reset")
      .setDescription(
        [
          "Your bank password has been reset. Here's your new one:",
          "",
          `\`\`\`${newPassword}\`\`\``,
          "",
          "Keep this safe - anyone with it can access your bank account.",
        ].join("\n"),
      )
      .setColor(0x5865f2)
      .setFooter({ text: "You can run reset-pass again any time to generate a new one" })
      .setTimestamp();

    let dmFailed = false;
    try {
      await ctx.user.send({ embeds: [dmEmbed] });
    } catch {
      dmFailed = true;
    }

    if (dmFailed) {
      const failEmbed = new EmbedBuilder()
        .setTitle("⚠️ Couldn't Send Your DM")
        .setDescription(
          "Your password **was** reset, but I couldn't deliver it to your DMs. Enable DMs from server members and run this command again to receive it.",
        )
        .setColor(0xed4245)
        .setTimestamp();
      return ctx.reply({ embeds: [failEmbed] });
    }

    const embed = new EmbedBuilder()
      .setTitle("🔐 Password Reset")
      .setDescription("Your new bank password has been sent to your DMs - please keep it safe!")
      .setColor(0x57f287)
      .setThumbnail(ctx.user.displayAvatarURL())
      .setFooter({ text: "Make sure your DMs stay enabled to receive future resets" })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};