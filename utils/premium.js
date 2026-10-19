const { EmbedBuilder } = require("discord.js");

const guildPremiumKey = (guildId) => `serverpremium_${guildId}`;
const userPremiumKey = (userId) => `userpremium_${userId}`;

async function isPremiumGuild(db, guildId) {
  return (await db.get(guildPremiumKey(guildId))) === true;
}

async function isPremiumUser(db, userId) {
  return (await db.get(userPremiumKey(userId))) === true;
}

function guildPremiumEmbed() {
  return new EmbedBuilder()
    .setTitle("⭐ Premium Server Feature")
    .setDescription(
      "This command is only available in **premium servers**.\n" +
      "Ask a server admin to upgrade to unlock it here.",
    )
    .setColor(0xf1c40f)
    .setTimestamp();
}

function userPremiumEmbed() {
  return new EmbedBuilder()
    .setTitle("⭐ Premium Feature")
    .setDescription("This command is only available to **premium members**.\nUpgrade to unlock it.")
    .setColor(0xf1c40f)
    .setTimestamp();
}

async function requireGuildPremium(ctx, client) {
  const premium = await isPremiumGuild(client.db, ctx.guild.id);
  if (!premium) {
    await ctx.reply({ embeds: [guildPremiumEmbed()] });
    return false;
  }
  return true;
}

async function requireUserPremium(ctx, client) {
  const premium = await isPremiumUser(client.db, ctx.user.id);
  if (!premium) {
    await ctx.reply({ embeds: [userPremiumEmbed()] });
    return false;
  }
  return true;
}

module.exports = {
  isPremiumGuild,
  isPremiumUser,
  guildPremiumEmbed,
  userPremiumEmbed,
  requireGuildPremium,
  requireUserPremium,
};