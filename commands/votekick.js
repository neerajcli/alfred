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

const { requireGuildPremium, isPremiumGuild } = require("../utils/premium");

const DISABLED_GUILD_ID = "568902211980099605";
const EXTRA_PROTECTED_ID = "670234327749099521";
const VOTE_THRESHOLD = 5;

const voteKey = (guildId, userId) => `votekick_${guildId}_${userId}`;

async function getVotekick(db, guildId, userId) {
  return await db.get(voteKey(guildId, userId));
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
    new ButtonBuilder()
      .setCustomId("votekick:done")
      .setLabel(label)
      .setEmoji(emoji)
      .setStyle(style)
      .setDisabled(true),
  );
}

function reasonsList(votes) {
  return votes.map((v, i) => `**${i + 1}.** <@${v.voterId}>: ${v.reason}`).join("\n");
}

function votekickEmbed(record, targetTag, { status = "pending", note = null } = {}) {
  const statusMeta = {
    pending: { title: "🗳️ Votekick Threshold Reached", color: 0xfee75c },
    approved: { title: "✅ Votekick Approved", color: 0x57f287 },
    rejected: { title: "❌ Votekick Rejected", color: 0xed4245 },
  }[status];

  const embed = new EmbedBuilder()
    .setTitle(statusMeta.title)
    .setDescription(`Target: <@${record.targetId}> (${targetTag})`)
    .addFields({ name: `Votes (${record.votes.length}/${VOTE_THRESHOLD})`, value: reasonsList(record.votes) })
    .setColor(statusMeta.color)
    .setTimestamp();

  if (note) embed.addFields({ name: status === "approved" ? "Note" : "Reason", value: note });

  return embed;
}

module.exports = {
  category: "Server Premium",
  data: new SlashCommandBuilder()
    .setName("votekick")
    .setDescription("Vote to kick a user.")
    .addUserOption((opt) => opt.setName("user").setDescription("Who to votekick").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Why you're voting to kick them").setRequired(true)),

  allowPrefix: true,
  optionOrder: ["user"],

  async execute(ctx, client) {
    const db = client.db;

    if (ctx.guild.id === DISABLED_GUILD_ID) return ctx.reply("Mod commands are disabled in this server.");

    if (!(await requireGuildPremium(ctx, client))) return;

    const modLog = await checkModLogReady(ctx, client);
    if (!modLog.ok) return ctx.reply(modLog.error);

    const targetMember =
      ctx.source === "slash" ? ctx.raw.options.getMember("user") : ctx.raw.mentions.members.first();
    if (!targetMember) return ctx.reply("Please mention someone to votekick.");
    if (targetMember.id === ctx.user.id) return ctx.reply("You can't vote to kick yourself!");
    if (targetMember.id === EXTRA_PROTECTED_ID) return ctx.reply("You can't votekick this user!");
    if (targetMember.user.bot) return ctx.reply("You can't votekick a bot!");
    if (targetMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return ctx.reply("You can't vote to kick an admin!");
    }

    const reason = (ctx.source === "slash" ? ctx.getString("reason") : ctx.restText)?.trim();
    if (!reason) return ctx.reply("Please provide a reason.");

    let record = await getVotekick(db, ctx.guild.id, targetMember.id);
    if (record?.status === "awaiting_review") {
      return ctx.reply("This user already has a pending votekick awaiting admin review.");
    }
    if (!record) record = { targetId: targetMember.id, votes: [], status: "pending" };

    if (record.votes.some((v) => v.voterId === ctx.user.id)) {
      return ctx.reply("You have already voted to kick this user.");
    }

    record.votes.push({ voterId: ctx.user.id, reason });

    if (record.votes.length < VOTE_THRESHOLD) {
      await db.set(voteKey(ctx.guild.id, targetMember.id), record);

      const embed = new EmbedBuilder()
        .setTitle("🗳️ Votekick")
        .setDescription(
          `You voted to kick **${targetMember.user.username}** for: ${reason}\n**${record.votes.length}/${VOTE_THRESHOLD}** votes so far.`,
        )
        .setColor(0xfee75c)
        .setTimestamp();
      await ctx.reply({ embeds: [embed] });

      try {
        await targetMember.send(
          `You were voted for being kicked from **${ctx.guild.name}** by ${ctx.user.tag} for: ${reason}`,
        );
      } catch (err) {
        console.error("Failed to DM votekick target:", err);
      }
      return;
    }

    record.status = "awaiting_review";

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`votekick:approve:${targetMember.id}`)
        .setLabel("Approve (Kick)")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`votekick:reject:${targetMember.id}`)
        .setLabel("Reject")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Danger),
    );

    const sent = await modLog.channel.send({
      embeds: [votekickEmbed(record, targetMember.user.tag)],
      components: [row],
    });
    record.messageId = sent.id;
    await db.set(voteKey(ctx.guild.id, targetMember.id), record);

    const embed = new EmbedBuilder()
      .setTitle("🗳️ Votekick Threshold Reached")
      .setDescription(
        `You voted to kick **${targetMember.user.username}** for: ${reason}\nThis was the **${VOTE_THRESHOLD}th** vote - it's now awaiting admin review.`,
      )
      .setColor(0xfee75c)
      .setTimestamp();
    await ctx.reply({ embeds: [embed] });

    try {
      await targetMember.send(
        `You were voted for being kicked from **${ctx.guild.name}** by ${ctx.user.tag} for: ${reason}`,
      );
    } catch (err) {
      console.error("Failed to DM votekick target:", err);
    }
  },

  async handleButton(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "Only admins can review votekicks.", flags: MessageFlags.Ephemeral });
    }

    const [, action, targetId] = interaction.customId.split(":");

    if (interaction.user.id === targetId) {
      return interaction.reply({
        content: "You can't decide the outcome of your own votekick - please wait for another admin.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (action === "approve") return approveVotekick(interaction, client, targetId);
    if (action === "reject") return openRejectModal(interaction, targetId);
  },

  async handleModal(interaction, client) {
    const [, kind, targetId] = interaction.customId.split(":");
    if (kind !== "rejectModal") return;
    return finalizeReject(interaction, client, targetId);
  },
};

async function approveVotekick(interaction, client, targetId) {
  const db = client.db;
  const guildId = interaction.guild.id;
  const record = await getVotekick(db, guildId, targetId);
  if (!record || record.status !== "awaiting_review") {
    return interaction.reply({ content: "This votekick is no longer pending.", flags: MessageFlags.Ephemeral });
  }

  const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
  if (!targetMember) {
    await db.delete(voteKey(guildId, targetId));
    return interaction.reply({ content: "That user is no longer in the server.", flags: MessageFlags.Ephemeral });
  }
  if (!targetMember.kickable) {
    return interaction.reply({
      content: "I can't kick this user - check my role position and permissions.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const targetTag = targetMember.user.tag;

  try {
    await targetMember.kick(`Votekick approved by ${interaction.user.tag}`);
  } catch (err) {
    console.error("Failed to execute votekick approval:", err);
    return interaction.reply({
      content: "Failed to kick - make sure I have sufficient permissions. Nothing was changed.",
      flags: MessageFlags.Ephemeral,
    });
  }

  await db.delete(voteKey(guildId, targetId));

  let dmFailed = false;
  try {
    await targetMember.send(
      `You were voted to be kicked from **${interaction.guild.name}** and it has been approved by ${interaction.user.tag}. You have been kicked.`,
    );
  } catch {
    dmFailed = true;
  }

  const embed = votekickEmbed(record, targetTag, {
    status: "approved",
    note: dmFailed ? "Kicked, but the user couldn't be DMed." : "User notified via DM.",
  });

  await interaction.update({
    embeds: [embed],
    components: [disabledRow(`Approved by ${interaction.user.username}`, ButtonStyle.Success, "✅")],
  });
}

async function openRejectModal(interaction, targetId) {
  const modal = new ModalBuilder()
    .setCustomId(`votekick:rejectModal:${targetId}`)
    .setTitle("Reject Votekick")
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

  const record = await getVotekick(db, guildId, targetId);
  if (!record || record.status !== "awaiting_review") {
    return interaction.reply({ content: "This votekick is no longer pending.", flags: MessageFlags.Ephemeral });
  }

  await db.delete(voteKey(guildId, targetId));

  const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
  const targetTag = targetMember?.user.tag ?? targetId;

  let dmFailed = false;
  if (targetMember) {
    try {
      await targetMember.send(
        `You were voted to be kicked from **${interaction.guild.name}** and it has been rejected by ${interaction.user.tag} for: ${reason}`,
      );
    } catch {
      dmFailed = true;
    }
  } else {
    dmFailed = true;
  }

  const embed = votekickEmbed(record, targetTag, {
    status: "rejected",
    note: reason + (dmFailed ? "\n\n*(User couldn't be DMed.)*" : ""),
  });

  await interaction.update({
    embeds: [embed],
    components: [disabledRow(`Rejected by ${interaction.user.username}`, ButtonStyle.Danger, "❌")],
  });
}