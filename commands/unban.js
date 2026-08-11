const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const DISABLED_GUILD_ID = "568902211980099605";

async function checkModLogReady(ctx, client) {
  const enabled = await client.db.get(`mode_${ctx.guild.id}`);
  if (enabled !== true) return { ok: true, channel: null };

  const configured = await client.db.get(`modcd_${ctx.guild.id}`);
  if (configured !== true) {
    return {
      ok: false,
      error: `Mod log is enabled but no channel is set - set one with ${client.mentionCommand("modlogs channel")} first.`,
    };
  }

  const channelId = await client.db.get(`modc_${ctx.guild.id}`);
  const channel = ctx.guild.channels.cache.get(channelId);
  if (!channel) {
    return { ok: false, error: "The configured mod log channel no longer exists - please reconfigure it." };
  }

  return { ok: true, channel };
}

module.exports = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user by ID.")
    .addStringOption((opt) => opt.setName("user-id").setDescription("The user's ID").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the unban").setRequired(false)),

  allowPrefix: true,
  optionOrder: ["user-id"],

  async execute(ctx, client) {
    if (ctx.guild.id === DISABLED_GUILD_ID) return ctx.reply("Mod commands are disabled in this server.");
    if (!ctx.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return ctx.reply("You need the **Ban Members** permission to do this.");
    }

    const rawInput = ctx.source === "slash" ? ctx.getString("user-id") : ctx.fullText?.split(/ +/)[0];
    const rawId = rawInput?.replace(/[<@!>]/g, "").trim();

    if (!rawId || !await client.users.fetch(rawId)) {
      return ctx.reply("Please provide a valid user ID.");
    }

    const banEntry = await ctx.guild.bans.fetch(rawId, { force: true }).catch(() => null);
    if (!banEntry) return ctx.reply("That user isn't banned.");

    const reason = (
      ctx.source === "slash" ? ctx.getString("reason") : ctx.restText
    )?.trim() || "No reason provided.";

    const modLog = await checkModLogReady(ctx, client);
    if (!modLog.ok) return ctx.reply(modLog.error);

    try {
      await ctx.guild.members.unban(rawId, reason);
    } catch (err) {
      console.error("Failed to unban user:", err);
      return ctx.reply("Failed to unban that user - make sure I have sufficient permissions.");
    }

    const target = banEntry.user;

    const embed = new EmbedBuilder()
      .setTitle("✅ User Unbanned")
      .setDescription(`**${target.tag}** has been unbanned.`)
      .addFields({ name: "Moderator", value: `${ctx.user}`, inline: true }, { name: "Reason", value: reason })
      .setColor(0x57f287)
      .setTimestamp();
    await ctx.reply({ embeds: [embed] });

    if (modLog.channel) {
      const logEmbed = new EmbedBuilder()
        .setTitle("✅ User Unbanned")
        .addFields(
          { name: "User", value: `${target.tag} (${target.id})` },
          { name: "Moderator", value: `${ctx.user}`, inline: true },
          { name: "Reason", value: reason },
        )
        .setColor(0x57f287)
        .setTimestamp();
      await modLog.channel.send({ embeds: [logEmbed] }).catch((err) => console.error("Failed to post unban log:", err));
    }
  },
};