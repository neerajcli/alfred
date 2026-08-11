const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { requireGuildPremium } = require("../utils/premium");

const DISABLED_GUILD_ID = "568902211980099605";
const EXTRA_PROTECTED_ID = "670234327749099521";

const reportKey = (guildId, userId) => `banreport_${guildId}_${userId}`;

async function getReport(db, guildId, userId) {
  return await db.get(reportKey(guildId, userId));
}

async function checkModLogReady(ctx, client) {
  const enabled = await client.db.get(`mode_${ctx.guild.id}`);
  if (enabled !== true) return { ok: false, error: "Mod logs must be enabled to use this command." };

  const configured = await client.db.get(`modcd_${ctx.guild.id}`);
  if (configured !== true) return { ok: false, error: "The mod log channel must be set to use this command." };

  const channelId = await client.db.get(`modc_${ctx.guild.id}`);
  const channel = ctx.guild.channels.cache.get(channelId);
  if (!channel) return { ok: false, error: "Mod log channel not found - please reconfigure it." };

  return { ok: true, channel };
}

function disabledRow(label, style, emoji) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ban:done").setLabel(label).setEmoji(emoji).setStyle(style).setDisabled(true),
  );
}

function reportEmbed(record, targetTag, { status = "pending", note = null } = {}) {
  const statusMeta = {
    pending: { title: "🚨 New Ban Report", color: 0xfee75c },
    approved: { title: "✅ Ban Report Accepted", color: 0x57f287 },
    rejected: { title: "❌ Ban Report Rejected", color: 0xed4245 },
  }[status];

  const embed = new EmbedBuilder()
    .setTitle(statusMeta.title)
    .addFields(
      { name: "Target", value: `<@${record.targetId}> (${targetTag})`, inline: true },
      { name: "Reported By", value: `<@${record.reporterId}>`, inline: true },
      { name: "Reason", value: record.reason },
    )
    .setColor(statusMeta.color)
    .setTimestamp();

  if (note) embed.addFields({ name: status === "approved" ? "Note" : "Rejection Reason", value: note });

  return embed;
}

module.exports = {
  category: "Server Premium",
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Report a user for an admin to review and ban.")
    .addUserOption((opt) => opt.setName("user").setDescription("Who to report").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Why they should be banned").setRequired(true)),

  allowPrefix: true,
  optionOrder: ["user"],

  async execute(ctx, client) {
    const db = client.db;

    if (ctx.guild.id === DISABLED_GUILD_ID) return ctx.reply("Mod commands are disabled in this server.");

    if (!(await requireGuildPremium(ctx, client))) return;

    if (!ctx.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return ctx.reply("You need the **Ban Members** permission to file a ban report.");
    }

    const modLog = await checkModLogReady(ctx, client);
    if (!modLog.ok) return ctx.reply(modLog.error);

    let targetMember;
    if (ctx.source === "slash") {
      targetMember = ctx.raw.options.getMember("user");
    } else {
      targetMember = ctx.raw.mentions.members.first();
      if (!targetMember) {
        const rawId = ctx.restText?.split(/ +/)[0]?.replace(/[<@!>]/g, "");
        if (rawId) targetMember = await ctx.guild.members.fetch(rawId).catch(() => null);
      }
    }
    if (!targetMember) return ctx.reply("Please mention someone (or provide a valid user ID) to report.");
    if (targetMember.id === ctx.user.id) return ctx.reply("You can't report yourself to be banned!");
    if (targetMember.id === EXTRA_PROTECTED_ID) return ctx.reply("You can't report this user!");
    if (targetMember.user.bot) return ctx.reply("You can't report a bot!");
    if (targetMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return ctx.reply("You can't report an admin to be banned!");
    }

    const reason = (ctx.source === "slash" ? ctx.getString("reason") : ctx.restText)?.trim();
    if (!reason) return ctx.reply("Please provide a reason.");

    const existing = await getReport(db, ctx.guild.id, targetMember.id);
    if (existing) return ctx.reply("There is already a pending ban report against that user.");

    const record = { targetId: targetMember.id, reporterId: ctx.user.id, reason };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ban:approve:${targetMember.id}`)
        .setLabel("Approve (Ban)")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`ban:reject:${targetMember.id}`)
        .setLabel("Reject")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Danger),
    );

    const sent = await modLog.channel.send({
      embeds: [reportEmbed(record, targetMember.user.tag)],
      components: [row],
    });
    record.messageId = sent.id;
    await db.set(reportKey(ctx.guild.id, targetMember.id), record);

    const embed = new EmbedBuilder()
      .setTitle("🚨 Ban Report Filed")
      .setDescription(`Your report against **${targetMember.user.username}** has been sent for admin review.`)
      .addFields({ name: "Reason", value: reason })
      .setColor(0xfee75c)
      .setTimestamp();
    await ctx.reply({ embeds: [embed] });

    try {
      await targetMember.send(
        `A ban report has been filed against you in **${ctx.guild.name}** by ${ctx.user.tag} for: ${reason}`,
      );
    } catch (err) {
      console.error("Failed to DM ban report target:", err);
    }

    try {
      await ctx.user.send(
        `Your ban report in **${ctx.guild.name}** against **${targetMember.user.username}** for "${reason}" has been received and is awaiting admin approval.`,
      );
    } catch (err) {
      console.error("Failed to DM ban report reporter:", err);
    }
  },

  async handleButton(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "Only admins can review ban reports.", flags: MessageFlags.Ephemeral });
    }

    const [, action, targetId] = interaction.customId.split(":");

    if (interaction.user.id === targetId) {
      return interaction.reply({
        content: "You can't decide the outcome of a ban report filed against yourself - please wait for another admin.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (action === "approve") return approveReport(interaction, client, targetId);
    if (action === "reject") return openRejectModal(interaction, targetId);
  },

  async handleModal(interaction, client) {
    const [, kind, targetId] = interaction.customId.split(":");
    if (kind !== "rejectModal") return;
    return finalizeReject(interaction, client, targetId);
  },
};

async function approveReport(interaction, client, targetId) {
  const db = client.db;
  const guildId = interaction.guild.id;
  const record = await getReport(db, guildId, targetId);
  if (!record) {
    return interaction.reply({ content: "This ban report is no longer pending.", flags: MessageFlags.Ephemeral });
  }

  const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
  if (!targetMember) {
    await db.delete(reportKey(guildId, targetId));
    return interaction.reply({ content: "That user is no longer in the server.", flags: MessageFlags.Ephemeral });
  }
  if (!targetMember.bannable) {
    return interaction.reply({
      content: "I can't ban this user - check my role position and permissions.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const targetTag = targetMember.user.tag;

  try {
    await targetMember.ban({ reason: `Ban report approved by ${interaction.user.tag}: ${record.reason}` });
  } catch (err) {
    console.error("Failed to execute ban report approval:", err);
    return interaction.reply({
      content: "Failed to ban - make sure I have sufficient permissions. Nothing was changed.",
      flags: MessageFlags.Ephemeral,
    });
  }

  await db.delete(reportKey(guildId, targetId));

  let targetDmFailed = false;
  try {
    await targetMember.send(
      `The ban report against you in **${interaction.guild.name}** has been approved by ${interaction.user.tag}. You have been banned.`,
    );
  } catch {
    targetDmFailed = true;
  }

  const reporter = await client.users.fetch(record.reporterId).catch(() => null);
  if (reporter) {
    try {
      await reporter.send(
        `Your ban report in **${interaction.guild.name}** against **${targetTag}** has been approved by ${interaction.user.tag}.`,
      );
    } catch (err) {
      console.error("Failed to DM ban report reporter after approval:", err);
    }
  }

  const embed = reportEmbed(record, targetTag, {
    status: "approved",
    note: targetDmFailed ? "Banned, but the user couldn't be DMed." : "User notified via DM.",
  });

  await interaction.update({
    embeds: [embed],
    components: [disabledRow(`Approved by ${interaction.user.username}`, ButtonStyle.Success, "✅")],
  });
}

async function openRejectModal(interaction, targetId) {
  const modal = new ModalBuilder()
    .setCustomId(`ban:rejectModal:${targetId}`)
    .setTitle("Reject Ban Report")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Rejection reason (optional)")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(300)
          .setPlaceholder("Leave blank for 'No reason provided'")
          .setRequired(false),
      ),
    );

  return interaction.showModal(modal);
}

async function finalizeReject(interaction, client, targetId) {
  const db = client.db;
  const guildId = interaction.guild.id;
  const reason = interaction.fields.getTextInputValue("reason").trim() || "No reason provided";

  const record = await getReport(db, guildId, targetId);
  if (!record) {
    return interaction.reply({ content: "This ban report is no longer pending.", flags: MessageFlags.Ephemeral });
  }

  await db.delete(reportKey(guildId, targetId));

  const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
  const targetTag = targetMember?.user.tag ?? targetId;

  let targetDmFailed = false;
  if (targetMember) {
    try {
      await targetMember.send(
        `The ban report against you in **${interaction.guild.name}** has been rejected by ${interaction.user.tag} for: ${reason}`,
      );
    } catch {
      targetDmFailed = true;
    }
  } else {
    targetDmFailed = true;
  }

  const reporter = await client.users.fetch(record.reporterId).catch(() => null);
  if (reporter) {
    try {
      await reporter.send(
        `Your ban report in **${interaction.guild.name}** against **${targetTag}** has been rejected by ${interaction.user.tag} for: ${reason}`,
      );
    } catch (err) {
      console.error("Failed to DM ban report reporter after rejection:", err);
    }
  }

  const embed = reportEmbed(record, targetTag, {
    status: "rejected",
    note: reason + (targetDmFailed ? "\n\n*(User couldn't be DMed.)*" : ""),
  });

  await interaction.update({
    embeds: [embed],
    components: [disabledRow(`Rejected by ${interaction.user.username}`, ButtonStyle.Danger, "❌")],
  });
}