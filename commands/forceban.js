const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const DISABLED_GUILD_ID = "568902211980099605";
const EXTRA_PROTECTED_ID = "670234327749099521";

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
    .setName("forceban")
    .setDescription("Ban a user from the server.")
    .addStringOption((opt) => opt.setName("user-id").setDescription("The user's ID").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the ban").setRequired(false)),

  allowPrefix: true,
  optionOrder: ["user-id"],

  async execute(ctx, client) {
    if (ctx.guild.id === DISABLED_GUILD_ID) return ctx.reply("Mod commands are disabled in this server.");
    if (!ctx.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return ctx.reply("Only admins can force ban.");
    }

    const rawInput = ctx.source === "slash" ? ctx.getString("user-id") : ctx.fullText?.split(/ +/)[0];
    const rawId = rawInput?.replace(/[<@!>]/g, "").trim();

    if (!rawId) {
      return ctx.reply("Please provide a valid user ID.");
    }
    if (rawId === ctx.user.id) return ctx.reply("You can't ban yourself!");
    if (rawId === EXTRA_PROTECTED_ID) return ctx.reply("You can't ban this user!");
    if (rawId === client.user.id) return ctx.reply("You can't ban me!");

    let target;
    try {
      target = await client.users.fetch(rawId);
    } catch {
      return ctx.reply("Couldn't find a Discord account with that ID.");
    }
    if (target.bot) return ctx.reply("You can't ban a bot with this command!");

    const member = await ctx.guild.members.fetch(rawId).catch(() => null);
    if (member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return ctx.reply("You can't ban an admin!");
    }

    const alreadyBanned = await ctx.guild.bans.fetch(rawId, { force: true }).catch(() => null);
    if (alreadyBanned) return ctx.reply(`**${target.tag}** is already banned.`);

    const reason = (
      ctx.source === "slash" ? ctx.getString("reason") : ctx.restText
    )?.trim() || "No reason provided.";

    const modLog = await checkModLogReady(ctx, client);
    if (!modLog.ok) return ctx.reply(modLog.error);

    let dmFailed = !member;
    if (member) {
      try {
        await member.send(`You were banned from **${ctx.guild.name}** by ${ctx.user.tag} for: ${reason}`);
      } catch {
        dmFailed = true;
      }
    }

    try {
      await ctx.guild.members.ban(rawId, { reason });
    } catch (err) {
      console.error("Failed to force-ban user:", err);
      return ctx.reply("Failed to ban that user - make sure I have sufficient permissions.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🔨 Member Force-Banned")
      .setDescription(
        `**${target.tag}** has been banned${dmFailed ? " (no DM sent - not currently a member, or DMs closed)" : ""}.`,
      )
      .addFields({ name: "Moderator", value: `${ctx.user}`, inline: true }, { name: "Reason", value: reason })
      .setColor(0xed4245)
      .setTimestamp();
    await ctx.reply({ embeds: [embed] });

    if (modLog.channel) {
      const logEmbed = new EmbedBuilder()
        .setTitle("🔨 Member Force-Banned")
        .addFields(
          { name: "User", value: `${target.tag} (${target.id})` },
          { name: "Moderator", value: `${ctx.user}`, inline: true },
          { name: "Reason", value: reason },
        )
        .setColor(0xed4245)
        .setTimestamp();
      await modLog.channel.send({ embeds: [logEmbed] }).catch((err) => console.error("Failed to post ban log:", err));
    }
  },
};