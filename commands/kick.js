const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const DISABLED_GUILD_ID = "568902211980099605";
const EXTRA_PROTECTED_ID = "670234327749099521";

async function resolveTarget(ctx, client) {
  let user = ctx.getUser("user");
  if (user) return user;
  if (ctx.source !== "message") return null;

  const rawToken = ctx.fullText?.split(/ +/)[0];
  const id = rawToken?.replace(/[<@!>]/g, "");
  if (!id) return null;

  return client.users.fetch(id).catch(() => null);
}

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
    .setName("kick")
    .setDescription("Kick a user from the server.")
    .addUserOption((opt) => opt.setName("user").setDescription("Who to kick").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the kick").setRequired(false)),

  allowPrefix: true,
  optionOrder: ["user"],

  async execute(ctx, client) {
    if (ctx.guild.id === DISABLED_GUILD_ID) return ctx.reply("Mod commands are disabled in this server.");
    if (!ctx.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return ctx.reply("You need the **Kick Members** permission to do this.");
    }

    const target = await resolveTarget(ctx, client);
    if (!target) return ctx.reply("Please mention someone to kick.");
    if (target.id === ctx.user.id) return ctx.reply("You can't kick yourself!");
    if (target.id === EXTRA_PROTECTED_ID) return ctx.reply("You can't kick this user!");
    if (target.bot) return ctx.reply("You can't kick a bot!");

    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    if (!member) return ctx.reply("That user isn't a member of this server.");
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return ctx.reply("You can't kick an admin!");
    if (!member.kickable) return ctx.reply("I don't have permission to kick this user - check my role position.");

    const reason = (
      ctx.source === "slash" ? ctx.getString("reason") : ctx.restText
    )?.trim() || "No reason provided.";

    const modLog = await checkModLogReady(ctx, client);
    if (!modLog.ok) return ctx.reply(modLog.error);

    let dmFailed = false;
    try {
      await member.send(`You were kicked from **${ctx.guild.name}** by ${ctx.user.tag} for: ${reason}`);
    } catch {
      dmFailed = true;
    }

    try {
      await member.kick(reason);
    } catch (err) {
      console.error("Failed to kick user:", err);
      return ctx.reply("Failed to kick that user - make sure I have sufficient permissions and my role is above theirs.");
    }

    const embed = new EmbedBuilder()
      .setTitle("👢 Member Kicked")
      .setDescription(`**${target.tag}** has been kicked${dmFailed ? " (DM failed - their DMs may be closed)" : ""}.`)
      .addFields({ name: "Moderator", value: `${ctx.user}`, inline: true }, { name: "Reason", value: reason })
      .setColor(0xed4245)
      .setTimestamp();
    await ctx.reply({ embeds: [embed] });

    if (modLog.channel) {
      const logEmbed = new EmbedBuilder()
        .setTitle("👢 Member Kicked")
        .addFields(
          { name: "User", value: `${target.tag} (${target.id})` },
          { name: "Moderator", value: `${ctx.user}`, inline: true },
          { name: "Reason", value: reason },
        )
        .setColor(0xed4245)
        .setTimestamp();
      await modLog.channel.send({ embeds: [logEmbed] }).catch((err) => console.error("Failed to post kick log:", err));
    }
  },
};