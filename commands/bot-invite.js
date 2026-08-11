const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

function inviteEmbed(user, isSelf) {
  return new EmbedBuilder()
    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
    .setTitle(isSelf ? "🔗 Invite Me!" : "🔗 Bot Invite URL")
    .setDescription(
      `[Click here](https://discord.com/oauth2/authorize?client_id=${user.id}&scope=bot&permissions=8) to invite ${isSelf ? "me" : `**${user.tag}**`} to your server.`,
    )
    .setThumbnail(user.displayAvatarURL())
    .setColor(0x5865f2)
    .setTimestamp();
}

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder()
    .setName("bot-invite")
    .setDescription("Get an invite link for a bot, or for me if no ID is given.")
    .addStringOption((opt) =>
      opt.setName("bot-id").setDescription("The bot's user ID (leave blank for my own invite)").setRequired(false),
    ),

  allowPrefix: true,
  optionOrder: ["bot-id"],

  async execute(ctx, client) {
    const botId = ctx.getString("bot-id");

    if (!botId || botId === "670234327749099521") {
      return ctx.reply({ embeds: [inviteEmbed(client.user, true)] });
    }

    let targetUser;
    try {
      targetUser = await client.users.fetch(botId);
    } catch {
      return ctx.reply("Couldn't find a Discord account with that ID. Double-check it and try again.");
    }

    if (!targetUser.bot) {
      return ctx.reply(`That ID belongs to a **user**, not a bot - no invite link to give.`);
    }

    return ctx.reply({ embeds: [inviteEmbed(targetUser, false)] });
  },
};