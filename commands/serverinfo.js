const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { formatExpiry } = require("../utils/time");

module.exports = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Show information about this server."),

  allowPrefix: true,

  async execute(ctx, client) {
    const guild = ctx.guild;
    const owner = await guild.fetchOwner().catch(() => null);

    const isPremium = (await client.db.get("serverpremium_" + guild.id)) === true;
    let premiumDisplay = "❌ No";
    if (isPremium) {
      const storedExpiry = await client.db.get("serverpremiumtime_" + guild.id);
      premiumDisplay =
        storedExpiry === "never" || storedExpiry == null
          ? "✅ Yes (Permanent)"
          : `✅ Yes (expires ${formatExpiry(storedExpiry)})`;
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: guild.name, iconURL: guild.iconURL() ?? undefined })
      .setTitle(`📊 ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }) ?? null)
      .addFields(
        { name: "Owner", value: owner ? `${owner.user.tag}` : "Unknown", inline: true },
        { name: "Members", value: guild.memberCount.toLocaleString(), inline: true },
        { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: "Boost Level", value: `Tier ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
        { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },
        { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
        { name: "Bot Premium", value: premiumDisplay, inline: true },
      )
      .setColor(0x5865f2)
      .setFooter({ text: `Server ID: ${guild.id}` })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};