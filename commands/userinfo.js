const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const FLAG_LABELS = {
  Staff: "Discord Employee",
  Partner: "Discord Partner",
  Hypesquad: "HypeSquad Events",
  BugHunterLevel1: "Bug Hunter (Level 1)",
  BugHunterLevel2: "Bug Hunter (Level 2)",
  HypeSquadOnlineHouse1: "HypeSquad Bravery",
  HypeSquadOnlineHouse2: "HypeSquad Brilliance",
  HypeSquadOnlineHouse3: "HypeSquad Balance",
  PremiumEarlySupporter: "Early Supporter",
  TeamPseudoUser: "Team User",
  VerifiedBot: "Verified Bot",
  VerifiedDeveloper: "Verified Bot Developer",
  CertifiedModerator: "Discord Certified Moderator",
};

function discordTimestamp(ms) {
  const seconds = Math.floor(ms / 1000);
  return `<t:${seconds}:D> (<t:${seconds}:R>)`;
}

module.exports = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Check info about yourself or another member.")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Whose info to show (defaults to you)").setRequired(false),
    ),

  aliases: ["whois"],
  allowPrefix: true,
  optionOrder: ["user"],

  async execute(ctx, client) {
    const target = ctx.getUser("user") || ctx.user;

    const member = ctx.guild.members.cache.get(target.id) || (await ctx.guild.members.fetch(target.id).catch(() => null));
    if (!member) return ctx.reply("That user isn't a member of this server.");

    const userFlags = member.user.flags?.toArray() ?? [];
    const flagText = userFlags.length ? userFlags.map((flag) => FLAG_LABELS[flag] || flag).join(", ") : "None";

    const roleMentions = member.roles.cache
      .filter((role) => role.id !== ctx.guild.id)
      .sort((a, b) => b.position - a.position)
      .map((role) => `${role}`);
    let roleText = roleMentions.length ? roleMentions.join(", ") : "None";
    if (roleText.length > 1000) roleText = roleText.slice(0, 1000) + "…";

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
      .setThumbnail(target.displayAvatarURL({ size: 512 }))
      .addFields(
        { name: "👤 User", value: `${target}`, inline: true },
        { name: "🆔 ID", value: target.id, inline: true },
        { name: "🏷️ Nickname", value: member.nickname || "None", inline: true },
        { name: "📅 Account Created", value: discordTimestamp(target.createdTimestamp), inline: false },
        {
          name: "📥 Joined Server",
          value: member.joinedTimestamp ? discordTimestamp(member.joinedTimestamp) : "Unknown",
          inline: false,
        },
        { name: "🚩 Badges", value: flagText, inline: false },
        { name: `🎭 Roles (${roleMentions.length})`, value: roleText, inline: false },
      )
      .setFooter({ text: `Requested by ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};