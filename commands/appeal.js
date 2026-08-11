const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { isExpired, formatExpiry } = require("../utils/time");
const { syncEnforcement } = require("./wordmod");

const TARGET_CHANNEL_ID = "1327903156956561439";
const OWNER_ID = "504635146553524234";
const APPEAL_COOLDOWN_MS = 45 * 24 * 60 * 60 * 1000;
const MAX_APPEALS = 3;

function buildAppealModal(kind) {
  const isUser = kind === "user";
  const modal = new ModalBuilder()
    .setCustomId(`appeal:${kind}`)
    .setTitle(isUser ? "User Blacklist Appeal" : "Server Blacklist Appeal");

  const fields = isUser
    ? [
      {
        id: "email",
        label: "Email (optional)",
        placeholder: "N/A if you'd rather not share",
        style: TextInputStyle.Short,
        required: false,
      },
      {
        id: "details",
        label: "Blacklist Type & Expiry Date",
        placeholder: "e.g. Temporary - 2026-09-01, or Permanent",
        style: TextInputStyle.Short,
        required: true,
      },
      {
        id: "reason",
        label: "Why were you blacklisted?",
        style: TextInputStyle.Paragraph,
        required: true,
      },
      {
        id: "justification",
        label: "Why should you be whitelisted?",
        style: TextInputStyle.Paragraph,
        required: true,
      },
      {
        id: "agreement",
        label: "Agree to follow our rules? (Yes/No)",
        style: TextInputStyle.Short,
        required: true,
      },
    ]
    : [
      {
        id: "email",
        label: "Email (optional)",
        placeholder: "N/A if you'd rather not share",
        style: TextInputStyle.Short,
        required: false,
      },
      {
        id: "details",
        label: "Blacklist Type & Expiry Date",
        placeholder: "e.g. Temporary - 2026-09-01, or Permanent",
        style: TextInputStyle.Short,
        required: true,
      },
      {
        id: "reason",
        label: "Why was the server blacklisted?",
        style: TextInputStyle.Paragraph,
        required: true,
      },
      {
        id: "justification",
        label: "Why should the server be whitelisted?",
        style: TextInputStyle.Paragraph,
        required: true,
      },
      {
        id: "agreement",
        label: "Server agrees to follow rules? (Yes/No)",
        style: TextInputStyle.Short,
        required: true,
      },
    ];

  for (const field of fields) {
    const input = new TextInputBuilder()
      .setCustomId(field.id)
      .setLabel(field.label)
      .setStyle(field.style)
      .setRequired(field.required)
      .setMaxLength(field.style === TextInputStyle.Paragraph ? 1000 : 200);
    if (field.placeholder) input.setPlaceholder(field.placeholder);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}

function cooldownEmbed(expiryEpoch) {
  return new EmbedBuilder()
    .setTitle("⏳ Cooldown Active")
    .setDescription(`You need to wait until ${formatExpiry(expiryEpoch)} to appeal again.`)
    .setColor(0xed4245)
    .setTimestamp();
}

function buildDecisionRow(kind, id) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`appeal:accept:${kind}:${id}`)
      .setLabel("Accept")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`appeal:reject:${kind}:${id}`)
      .setLabel("Reject")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger),
  );
}

async function markResolved(interaction, label, color, actorTag) {
  if (!interaction.message) return;

  const original = interaction.message.embeds[0];
  const payload = { components: [] };
  if (original) {
    payload.embeds = [
      EmbedBuilder.from(original)
        .setColor(color)
        .setFooter({ text: `${label} by ${actorTag}` }),
    ];
  }

  try {
    await interaction.message.edit(payload);
  } catch (err) {
    console.error("Failed to update appeal log message:", err);
  }
}

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder()
    .setName("appeal")
    .setDescription("Appeal a blacklist punishment.")
    .addSubcommand((sub) => sub.setName("user").setDescription("Appeal your own user blacklist."))
    .addSubcommand((sub) => sub.setName("server").setDescription("Appeal this server's blacklist.")),

  allowPrefix: false,

  async execute(ctx, client) {
    const db = client.db;
    const sub = ctx.getSubcommand();

    if (sub === "user") {
      const isBlacklisted = await db.get("bl_" + ctx.user.id);
      if (isBlacklisted !== true) return ctx.reply("You are not blacklisted!");

      const pending = await db.get("appealed_" + ctx.user.id);
      if (pending === true) return ctx.reply("An appeal by you is already pending!");

      const totalAppeals = (await db.get("tappealed_" + ctx.user.id)) || 0;
      if (totalAppeals >= MAX_APPEALS) {
        return ctx.reply("You have already appealed 3 times - you can no longer appeal.");
      }

      const lastAppealed = await db.get(`utime_${ctx.user.id}`);
      if (lastAppealed) {
        const cooldownExpiry = lastAppealed + APPEAL_COOLDOWN_MS;
        if (!isExpired(cooldownExpiry)) {
          return ctx.reply({ embeds: [cooldownEmbed(cooldownExpiry)] });
        }
      }

      return ctx.raw.showModal(buildAppealModal("user"));
    }

    if (sub === "server") {
      if (!ctx.guild) return ctx.reply("This can only be used inside a server.");

      const isBlacklisted = await db.get("blguild_" + ctx.guild.id);
      if (isBlacklisted !== true) return ctx.reply("This server is not blacklisted!");

      const isAdmin = ctx.raw.member?.permissions?.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) return ctx.reply("Only admins can appeal against a server blacklist.");

      const pending = await db.get("sappealed_" + ctx.guild.id);
      if (pending === true) return ctx.reply("An appeal for this server is already pending!");

      const totalAppeals = (await db.get("stappealed_" + ctx.guild.id)) || 0;
      if (totalAppeals >= MAX_APPEALS) {
        return ctx.reply("This server has already appealed 3 times - it can no longer appeal.");
      }

      const lastAppealed = await db.get(`stime_${ctx.guild.id}`);
      if (lastAppealed) {
        const cooldownExpiry = lastAppealed + APPEAL_COOLDOWN_MS;
        if (!isExpired(cooldownExpiry)) {
          return ctx.reply({ embeds: [cooldownEmbed(cooldownExpiry)] });
        }
      }

      return ctx.raw.showModal(buildAppealModal("server"));
    }
  },

  async handleModal(interaction, client) {
    const parts = interaction.customId.split(":");

    if (parts[1] === "rejectreason") {
      const [, , kind, id] = parts;
      return finalizeReject(interaction, client, kind, id);
    }

    return finalizeSubmission(interaction, client, parts[1]);
  },

  async handleButton(interaction, client) {
    if (!client.owners.includes(interaction.user.id)) {
      return interaction.reply({ content: "Only bot devs can use this.", flags: MessageFlags.Ephemeral });
    }

    const [, action, kind, id] = interaction.customId.split(":");

    if (action === "accept") {
      await interaction.deferUpdate();
      return finalizeAccept(interaction, client, kind, id);
    }

    if (action === "reject") {
      const modal = new ModalBuilder()
        .setCustomId(`appeal:rejectreason:${kind}:${id}`)
        .setTitle("Reject Appeal")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("reason")
              .setLabel("Rejection reason")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(500),
          ),
        );
      return interaction.showModal(modal);
    }
  },
};

async function finalizeSubmission(interaction, client, kind) {
  const db = client.db;

  const email = interaction.fields.getTextInputValue("email") || "N/A";
  const details = interaction.fields.getTextInputValue("details");
  const reason = interaction.fields.getTextInputValue("reason");
  const justification = interaction.fields.getTextInputValue("justification");
  const agreement = interaction.fields.getTextInputValue("agreement");

  const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
  if (!targetChannel) {
    return interaction.reply({
      content: "A critical error occurred submitting your appeal. Please contact the developers.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTimestamp()
    .setFooter({ text: "Appeal collected by Alfred - awaiting review" });

  let id;
  if (kind === "user") {
    id = interaction.user.id;
    embed
      .setTitle("🙋 User Blacklist Appeal")
      .addFields(
        { name: "Username", value: interaction.user.tag, inline: true },
        { name: "User ID", value: id, inline: true },
        { name: "Email", value: email, inline: true },
        { name: "Blacklist Type & Expiry", value: details },
        { name: "Reason Blacklisted", value: reason },
        { name: "Why They Should Be Removed", value: justification },
        { name: "Agrees To Follow Rules", value: agreement, inline: true },
      );

    await db.set("appealed_" + id, true);
    await db.add("tappealed_" + id, 1);
  } else {
    id = interaction.guildId;
    embed
      .setTitle("🏳️ Server Blacklist Appeal")
      .addFields(
        { name: "Guild Name", value: interaction.guild?.name ?? "Unknown", inline: true },
        { name: "Guild ID", value: id, inline: true },
        { name: "Submitted By", value: `${interaction.user.tag} (${interaction.user.id})` },
        { name: "Email", value: email, inline: true },
        { name: "Blacklist Type & Expiry", value: details },
        { name: "Reason Blacklisted", value: reason },
        { name: "Why It Should Be Removed", value: justification },
        { name: "Server Agrees To Follow Rules", value: agreement, inline: true },
      );

    await db.set("sappealed_" + id, true);
    await db.add("stappealed_" + id, 1);
    await db.set("dmres_" + id, interaction.user.id);
  }

  await targetChannel.send({
    content: `<@${OWNER_ID}>`,
    embeds: [embed],
    components: [buildDecisionRow(kind, id)],
  });

  const confirmEmbed = new EmbedBuilder()
    .setTitle("✅ Appeal Submitted")
    .setDescription("You'll receive the result in your DMs within 7 days, provided your DMs are open.")
    .setColor(0x57f287)
    .setTimestamp();

  return interaction.reply({ embeds: [confirmEmbed], flags: MessageFlags.Ephemeral });
}

async function finalizeAccept(interaction, client, kind, id) {
  const db = client.db;

  if (kind === "user") {
    const targetUser = await client.users.fetch(id).catch(() => null);
    if (targetUser) {
      try {
        await targetUser.send("Your appeal for blacklist has been accepted. Make sure to follow our rules this time.");
      } catch {
      }
    }
    await db.delete("appealed_" + id);
    await db.delete(`utime_${id}`);
    await db.delete("bl_" + id);
    await db.delete("blreason_" + id);
    await db.delete("bltime_" + id);
    await db.delete("tappealed_" + id);
  } else {
    const dmTarget = await db.get("dmres_" + id);
    const targetUser = dmTarget ? await client.users.fetch(dmTarget).catch(() => null) : null;
    if (targetUser) {
      try {
        await targetUser.send("Your appeal for server blacklist has been accepted. Make sure to follow our rules now.");
      } catch {
      }
    }
    await db.delete("sappealed_" + id);
    await db.delete(`stime_${id}`);
    await db.delete("blguild_" + id);
    await db.delete("blguildtime_" + id);
    await db.delete("blguildreason_" + id);
    await db.delete("stappealed_" + id);
    await db.delete("dmres_" + id);
    await syncEnforcement(client, id).catch((err) =>
      console.error(`Failed to sync word moderation after whitelisting ${guild.id}:`, err),
    );
  }

  await markResolved(interaction, "✅ Accepted", 0x57f287, interaction.user.tag);
}

async function finalizeReject(interaction, client, kind, id) {
  const db = client.db;
  const reason = interaction.fields.getTextInputValue("reason");

  if (kind === "user") {
    const targetUser = await client.users.fetch(id).catch(() => null);
    if (targetUser) {
      try {
        await targetUser.send(`Your appeal for blacklist has been rejected.\nReason: ${reason}`);
      } catch {
      }
    }
    await db.delete("appealed_" + id);
    await db.set(`utime_${id}`, Date.now());
  } else {
    const dmTarget = await db.get("dmres_" + id);
    const targetUser = dmTarget ? await client.users.fetch(dmTarget).catch(() => null) : null;
    if (targetUser) {
      try {
        await targetUser.send(`Your appeal for server blacklist has been rejected.\nReason: ${reason}`);
      } catch {
      }
    }
    await db.delete("sappealed_" + id);
    await db.set(`stime_${id}`, Date.now());
  }

  await markResolved(interaction, "❌ Rejected", 0xed4245, interaction.user.tag);

  return interaction.reply({ content: `Appeal for \`${id}\` rejected.`, flags: MessageFlags.Ephemeral });
}