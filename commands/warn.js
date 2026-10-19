const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const DISABLED_GUILD_ID = "568902211980099605";
const EXTRA_PROTECTED_ID = "670234327749099521";
const MAX_REASON_LENGTH = 1000;

function warnsKey(guildId, userId) {
  return `warns_${guildId}_${userId}`;
}
function counterKey(guildId, userId) {
  return `warncounter_${guildId}_${userId}`;
}

async function getWarns(db, guildId, userId) {
  return (await db.get(warnsKey(guildId, userId))) || [];
}

async function nextWarnId(db, guildId, userId) {
  await db.add(counterKey(guildId, userId), 1);
  return db.get(counterKey(guildId, userId));
}

async function resolveUserArg(ctx, client) {
  let user = ctx.getUser("user");
  if (!user && ctx.source === "message") {
    const rawToken = ctx.restText?.split(/ +/)[0];
    const rawId = rawToken?.replace(/[<@!>]/g, "");
    if (rawId && /^\d{17,20}$/.test(rawId)) user = await client.users.fetch(rawId).catch(() => null);
  }
  return user;
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
    .setName("warn")
    .setDescription("Warn, view, or clear warnings for a user.")
    .addSubcommand((sub) =>
      sub
        .setName("user")
        .setDescription("Warn a user")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to warn").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the warning").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("view")
        .setDescription("View a user's warnings (defaults to yourself)")
        .addUserOption((opt) => opt.setName("user").setDescription("Whose warnings to view").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("clear")
        .setDescription("Clear a user's warnings")
        .addUserOption((opt) => opt.setName("user").setDescription("Whose warnings to clear").setRequired(true))
        .addStringOption((opt) =>
          opt.setName("warnid").setDescription("Clear only this specific warn ID (omit to clear all)").setRequired(false),
        ),
    ),

  allowPrefix: true,
  optionOrder: ["_subcommand", "user"],

  async execute(ctx, client) {
    const db = client.db;

    if (ctx.guild.id === DISABLED_GUILD_ID) {
      return ctx.reply("Mod commands are disabled in this server.");
    }

    const sub = ctx.getSubcommand();
    if (sub !== "user" && sub !== "view" && sub !== "clear") {
      return ctx.reply("Usage: `warn user <user> [reason]`, `warn view [user]`, or `warn clear <user> [warnid]`");
    }

    if (sub === "user") return handleWarnUser(ctx, client);
    if (sub === "view") return handleView(ctx, client);
    return handleClear(ctx, client);
  },
};

async function handleWarnUser(ctx, client) {
  const db = client.db;

  if (!ctx.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return ctx.reply("You need the **Moderate Members** permission to warn someone.");
  }

  const targetUser = await resolveUserArg(ctx, client);
  if (!targetUser) return ctx.reply("Please mention someone to warn.");
  if (targetUser.id === ctx.user.id) return ctx.reply("You can't warn yourself!");
  if (targetUser.id === EXTRA_PROTECTED_ID) return ctx.reply("You can't warn this user!");
  if (targetUser.bot) return ctx.reply("You can't warn a bot!");

  const targetMember = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
  if (!targetMember) return ctx.reply("That user isn't a member of this server.");
  if (targetMember.permissions.has(PermissionFlagsBits.Administrator)) {
    return ctx.reply("You can't warn an admin!");
  }

  const reason = (
    ctx.source === "slash" ? ctx.getString("reason") : ctx.restText.split(/ +/).slice(1).join(" ")
  )?.trim() || "No reason provided.";

  const modLog = await checkModLogReady(ctx, client);
  if (!modLog.ok) return ctx.reply(modLog.error);

  const warnId = await nextWarnId(db, ctx.guild.id, targetUser.id);
  const record = {
    id: String(warnId),
    reason,
    moderatorId: ctx.user.id,
    timestamp: Date.now(),
  };
  await db.push(warnsKey(ctx.guild.id, targetUser.id), record);

  const embed = new EmbedBuilder()
    .setTitle("⚠️ User Warned")
    .setDescription(`**${targetUser.tag}** has been warned.`)
    .addFields(
      { name: "Warn ID", value: record.id, inline: true },
      { name: "Moderator", value: `${ctx.user}`, inline: true },
      { name: "Reason", value: reason.slice(0, MAX_REASON_LENGTH) },
    )
    .setColor(0xed4245)
    .setTimestamp();
  await ctx.reply({ embeds: [embed] });

  if (modLog.channel) {
    const logEmbed = new EmbedBuilder()
      .setTitle("⚠️ Member Warned")
      .addFields(
        { name: "User", value: `${targetUser.tag} (${targetUser.id})` },
        { name: "Warn ID", value: record.id, inline: true },
        { name: "Moderator", value: `${ctx.user}`, inline: true },
        { name: "Reason", value: reason.slice(0, MAX_REASON_LENGTH) },
      )
      .setColor(0xed4245)
      .setTimestamp();
    await modLog.channel.send({ embeds: [logEmbed] }).catch((err) => console.error("Failed to post warn log:", err));
  }

  try {
    await targetMember.send(
      `You were warned in **${ctx.guild.name}** by ${ctx.user.tag} (warn ID \`${record.id}\`) for: ${reason}`,
    );
  } catch {
  }
}

async function handleView(ctx, client) {
  const db = client.db;

  const explicitTarget = await resolveUserArg(ctx, client);
  const targetUser = explicitTarget || ctx.user;

  if (targetUser.id !== ctx.user.id && !ctx.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return ctx.reply("You need the **Moderate Members** permission to view someone else's warnings.");
  }

  const warns = await getWarns(db, ctx.guild.id, targetUser.id);

  const embed = new EmbedBuilder()
    .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() })
    .setTitle(`⚠️ Warnings (${warns.length})`)
    .setColor(warns.length ? 0xfee75c : 0x57f287)
    .setTimestamp();

  if (!warns.length) {
    embed.setDescription("This user has no warnings.");
  } else {
    embed.setDescription(
      warns
        .map(
          (w) =>
            `**#${w.id}** — ${w.reason.slice(0, 200)}\n<t:${Math.floor(w.timestamp / 1000)}:R> by <@${w.moderatorId}>`,
        )
        .join("\n\n")
        .slice(0, 4000),
    );
  }

  return ctx.reply({ embeds: [embed] });
}

async function handleClear(ctx, client) {
  const db = client.db;

  if (!ctx.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return ctx.reply("You need the **Moderate Members** permission to clear warnings.");
  }

  const targetUser = await resolveUserArg(ctx, client);
  if (!targetUser) return ctx.reply("Please mention someone.");

  const warnId = (
    ctx.source === "slash" ? ctx.getString("warnid") : ctx.restText.split(/ +/).slice(1).join(" ")
  )?.trim() || null;

  const warns = await getWarns(db, ctx.guild.id, targetUser.id);
  if (!warns.length) return ctx.reply(`**${targetUser.tag}** has no warnings.`);

  let remaining = warns;
  let clearedDescription;

  if (warnId) {
    const exists = warns.some((w) => w.id === warnId);
    if (!exists) return ctx.reply(`No warning with ID \`${warnId}\` found for **${targetUser.tag}**.`);
    remaining = warns.filter((w) => w.id !== warnId);
    clearedDescription = `Cleared warn \`${warnId}\` for **${targetUser.tag}**. ${remaining.length} remaining.`;
  } else {
    remaining = [];
    clearedDescription = `Cleared all ${warns.length} warning(s) for **${targetUser.tag}**.`;
  }

  const modLog = await checkModLogReady(ctx, client);
  if (!modLog.ok) return ctx.reply(modLog.error);

  if (remaining.length) {
    await db.set(warnsKey(ctx.guild.id, targetUser.id), remaining);
  } else {
    await db.delete(warnsKey(ctx.guild.id, targetUser.id));
  }

  const embed = new EmbedBuilder()
    .setTitle("✅ Warnings Cleared")
    .setDescription(clearedDescription)
    .setColor(0x57f287)
    .setTimestamp();
  await ctx.reply({ embeds: [embed] });

  if (modLog.channel) {
    const logEmbed = new EmbedBuilder()
      .setTitle("✅ Member Warns Cleared")
      .addFields(
        { name: "User", value: `${targetUser.tag} (${targetUser.id})` },
        { name: "Scope", value: warnId ? `Single warn \`${warnId}\`` : "All warnings", inline: true },
        { name: "Moderator", value: `${ctx.user}`, inline: true },
      )
      .setColor(0x57f287)
      .setTimestamp();
    await modLog.channel.send({ embeds: [logEmbed] }).catch((err) => console.error("Failed to post clear log:", err));
  }
}