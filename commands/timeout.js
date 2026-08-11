const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const ms = require("ms");
const { formatExpiry } = require("../utils/time");

const DISABLED_GUILD_ID = "568902211980099605";
const EXTRA_PROTECTED_ID = "670234327749099521";
const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

async function resolveTarget(ctx, client, rawTokenGetter) {
  let user = ctx.getUser("user");
  if (user) return user;
  if (ctx.source !== "message") return null;

  const rawToken = rawTokenGetter();
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

async function applyTimeout(ctx, client, target, durationInput, reasonInput) {
  if (ctx.guild.id === DISABLED_GUILD_ID) return ctx.reply("Mod commands are disabled in this server.");
  if (!ctx.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return ctx.reply("You need the **Moderate Members** permission to do this.");
  }

  if (!target) return ctx.reply("Please mention someone to timeout.");
  if (target.id === ctx.user.id) return ctx.reply("You can't timeout yourself!");
  if (target.id === EXTRA_PROTECTED_ID) return ctx.reply("You can't timeout this user!");
  if (target.bot) return ctx.reply("You can't timeout a bot!");

  const member = await ctx.guild.members.fetch(target.id).catch(() => null);
  if (!member) return ctx.reply("That user isn't a member of this server.");
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return ctx.reply("You can't timeout an admin!");

  const currentUntil = member.communicationDisabledUntilTimestamp;
  if (currentUntil && currentUntil > Date.now()) {
    return ctx.reply(`This user is already timed out (expires ${formatExpiry(currentUntil)}).`);
  }

  const durationMs = durationInput ? ms(durationInput) : undefined;
  if (!durationMs || Number.isNaN(durationMs) || durationMs <= 0) {
    return ctx.reply("Please provide a valid duration, e.g. `10m`, `1h`, `7d`.");
  }
  if (durationMs > MAX_TIMEOUT_MS) {
    return ctx.reply("Timeout duration can't exceed Discord's limit of **28 days**.");
  }

  const reason = reasonInput?.trim() || "No reason provided.";

  const modLog = await checkModLogReady(ctx, client);
  if (!modLog.ok) return ctx.reply(modLog.error);

  await member.timeout(durationMs, reason);
  const expiresAt = Date.now() + durationMs;

  const embed = new EmbedBuilder()
    .setTitle("🔇 Member Timed Out")
    .setDescription(`**${target.tag}** has been timed out.`)
    .addFields(
      { name: "Duration", value: durationInput, inline: true },
      { name: "Expires", value: formatExpiry(expiresAt), inline: true },
      { name: "Moderator", value: `${ctx.user}`, inline: true },
      { name: "Reason", value: reason },
    )
    .setColor(0xed4245)
    .setTimestamp();
  await ctx.reply({ embeds: [embed] });

  if (modLog.channel) {
    const logEmbed = new EmbedBuilder()
      .setTitle("🔇 Member Timed Out")
      .addFields(
        { name: "User", value: `${target.tag} (${target.id})` },
        { name: "Duration", value: durationInput, inline: true },
        { name: "Expires", value: formatExpiry(expiresAt), inline: true },
        { name: "Moderator", value: `${ctx.user}`, inline: true },
        { name: "Reason", value: reason },
      )
      .setColor(0xed4245)
      .setTimestamp();
    await modLog.channel.send({ embeds: [logEmbed] }).catch((err) => console.error("Failed to post timeout log:", err));
  }

  try {
    await member.send(`You have been timed out in **${ctx.guild.name}** by ${ctx.user.tag} for ${durationInput} (${reason})`);
  } catch {
  }
}

async function removeTimeout(ctx, client, target, reasonInput) {
  if (ctx.guild.id === DISABLED_GUILD_ID) return ctx.reply("Mod commands are disabled in this server.");
  if (!ctx.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return ctx.reply("You need the **Moderate Members** permission to do this.");
  }

  if (!target) return ctx.reply("Please mention someone.");

  const member = await ctx.guild.members.fetch(target.id).catch(() => null);
  if (!member) return ctx.reply("That user isn't a member of this server.");

  const until = member.communicationDisabledUntilTimestamp;
  if (!until || until <= Date.now()) return ctx.reply("This user is not timed out.");

  const reason = reasonInput?.trim() || "No reason provided.";

  const modLog = await checkModLogReady(ctx, client);
  if (!modLog.ok) return ctx.reply(modLog.error);

  await member.timeout(null, reason);

  const embed = new EmbedBuilder()
    .setTitle("🔊 Timeout Removed")
    .setDescription(`**${target.tag}**'s timeout has been removed.`)
    .addFields({ name: "Moderator", value: `${ctx.user}`, inline: true }, { name: "Reason", value: reason })
    .setColor(0x57f287)
    .setTimestamp();
  await ctx.reply({ embeds: [embed] });

  if (modLog.channel) {
    const logEmbed = new EmbedBuilder()
      .setTitle("🔊 Timeout Removed")
      .addFields(
        { name: "User", value: `${target.tag} (${target.id})` },
        { name: "Moderator", value: `${ctx.user}`, inline: true },
        { name: "Reason", value: reason },
      )
      .setColor(0x57f287)
      .setTimestamp();
    await modLog.channel.send({ embeds: [logEmbed] }).catch((err) => console.error("Failed to post untimeout log:", err));
  }

  try {
    await member.send(`Your timeout in **${ctx.guild.name}** has been removed by ${ctx.user.tag}.`);
  } catch {
  }
}

module.exports = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout or remove a timeout from a user.")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Timeout a user")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to timeout").setRequired(true))
        .addStringOption((opt) => opt.setName("duration").setDescription("e.g. 10m, 1h, 7d (max 28d)").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the timeout").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a user's timeout")
        .addUserOption((opt) => opt.setName("user").setDescription("Whose timeout to remove").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for removing it").setRequired(false)),
    ),

  aliases: ["mute"],

  allowPrefix: true,
  optionOrder: ["_subcommand", "user"],

  async execute(ctx, client) {
    const sub = ctx.getSubcommand();

    if (sub === "add") {
      const target = await resolveTarget(ctx, client, () => ctx.fullText?.split(/ +/)[1]);
      const durationInput = ctx.source === "slash" ? ctx.getString("duration") : ctx.restText.split(/ +/)[1];
      const reasonInput = ctx.source === "slash" ? ctx.getString("reason") : ctx.restText.split(/ +/).slice(2).join(" ");
      return applyTimeout(ctx, client, target, durationInput, reasonInput);
    }

    if (sub === "remove") {
      const target = await resolveTarget(ctx, client, () => ctx.fullText?.split(/ +/)[1]);
      const reasonInput = ctx.source === "slash" ? ctx.getString("reason") : ctx.restText.split(/ +/).slice(1).join(" ");
      return removeTimeout(ctx, client, target, reasonInput);
    }

    return ctx.reply("Usage: `/timeout add <user> <duration> [reason]` or `/timeout remove <user> [reason]`");
  },
};