const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  LabelBuilder,
  TextInputBuilder,
  TextInputStyle,
  FileUploadBuilder,
  MessageFlags,
} = require("discord.js");
const crypto = require("crypto");
const { parseDurationSpec, resolveDurationSpec, humanizeDuration } = require("../utils/time");

const RAZORPAY_LINK = "https://razorpay.me/@alfredbot";
const PATREON_LINK = "https://www.patreon.com/AlfredBotDiscord/join";
const REVIEW_CHANNEL_ID = "1536007429735583795";
const OWNER_ID = "504635146553524234";

function makeClaimId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

const claimKey = (id) => `donationclaim_${id}`;

async function fetchReviewChannel(client) {
  return (
    client.channels.cache.get(REVIEW_CHANNEL_ID) ||
    (await client.channels.fetch(REVIEW_CHANNEL_ID).catch(() => null))
  );
}

function disabledRow(label, style, emoji) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("donation:done")
      .setLabel(label)
      .setEmoji(emoji)
      .setStyle(style)
      .setDisabled(true),
  );
}

function claimEmbed(claim, submitterTag, { status = "pending", note = null } = {}) {
  const statusMeta = {
    pending: { title: "💳 New Donation Claim", color: 0xfee75c },
    approved: { title: "✅ Donation Claim Approved", color: 0x57f287 },
    rejected: { title: "❌ Donation Claim Rejected", color: 0xed4245 },
  }[status];

  const embed = new EmbedBuilder()
    .setTitle(statusMeta.title)
    .addFields(
      { name: "Submitted By", value: `${submitterTag} (\`${claim.userId}\`)`, inline: true },
      { name: "Submitted From", value: `${claim.guildName} (\`${claim.guildId}\`)`, inline: true },
      { name: "Claim ID", value: `\`${claim.id}\``, inline: true },
      { name: "Email", value: claim.email || "Not provided", inline: true },
      { name: "Amount Donated", value: claim.amount, inline: true },
      { name: "Transaction ID", value: claim.transactionId, inline: true },
      { name: "Benefit(s) Requested", value: claim.benefitRequest },
    )
    .setColor(statusMeta.color)
    .setTimestamp();

  if (claim.screenshotUrl) embed.setImage(claim.screenshotUrl);
  if (note) embed.addFields({ name: status === "approved" ? "Granted" : "Reason", value: note });

  return embed;
}

function normalizeDurationInput(input) {
  const trimmed = input.trim().toLowerCase();
  if (["permanent", "lifetime", "forever"].includes(trimmed)) return "never";
  return input.trim();
}

function describeGrantedDuration(spec) {
  if (spec.type === "never") return "permanent";
  if (spec.type === "duration") return humanizeDuration(spec.ms);
  return "until " + new Date(spec.timestamp).toLocaleString();
}

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder()
    .setName("donation")
    .setDescription("Support the bot with a donation.")
    .addSubcommand((sub) => sub.setName("give").setDescription("Get the donation link"))
    .addSubcommand((sub) => sub.setName("benefits").setDescription("See what donating gets you"))
    .addSubcommand((sub) => sub.setName("benefits-claim").setDescription("Claim your donation benefits")),

  allowPrefix: false,

  async execute(ctx, client) {
    const sub = ctx.getSubcommand();

    if (sub === "give") {
      const embed = new EmbedBuilder()
        .setTitle("💖 Support Alfred")
        .setDescription("Help keep Alfred running and support the continued development of the bot!\n\n" + "🇮🇳 **For Indian users**\n" + `[💳 Donate via Razorpay](${RAZORPAY_LINK})\n\n` + "🌎 **For users outside India**\n" + `[💜 Support us on Patreon](${PATREON_LINK})`)
        .setColor(0x5865f2).setFooter({ text: "Every contribution helps keep Alfred running! ❤️" })
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }

    if (sub === "benefits") {
      const embed = new EmbedBuilder()
        .setTitle("🎁 Donation Benefits")
        .setDescription(
          "Here's what your donation gets you - use `/donation benefits-claim` once you've donated!",
        )
        .addFields(
          { name: "$1", value: "2 Redeems", inline: true },
          { name: "$3", value: "1 Month Premium (User or Server, your choice)", inline: true },
          { name: "$80", value: "Lifetime Premium (User or Server, your choice)", inline: true },
        )
        .setColor(0x9b59b6)
        .setFooter({ text: "Amounts scale - e.g. $2 = 4 Redeems, $6 = 2 Months Premium, etc. Benefits begin from the date they are approved, and any previous duration is not stacked or carried over." })
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }

    if (sub === "benefits-claim") {
      return openClaimModal(ctx.raw);
    }

    return ctx.reply("Usage: `/donation give`, `/donation benefits`, or `/donation benefits-claim`");
  },

  async handleButton(interaction, client) {
    if (!client.owners.includes(interaction.user.id)) {
      return interaction.reply({ content: "Only bot devs can review donation claims.", flags: MessageFlags.Ephemeral });
    }

    const [, action, claimId] = interaction.customId.split(":");
    if (action === "accept") return openGiveModal(interaction, claimId);
    if (action === "reject") return openRejectModal(interaction, claimId);
  },

  async handleModal(interaction, client) {
    const [, kind, claimId] = interaction.customId.split(":");
    if (kind === "claim") return handleClaimModalSubmit(interaction, client);
    if (kind === "rejectModal") return finalizeReject(interaction, client, claimId);
    if (kind === "giveModal") return finalizeAccept(interaction, client, claimId);
  },
};

async function openClaimModal(interaction) {
  const emailInput = new TextInputBuilder()
    .setCustomId("email")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Needed for further info if required")
    .setRequired(false);
  const emailLabel = new LabelBuilder().setLabel("Email (optional)").setTextInputComponent(emailInput);

  const amountInput = new TextInputBuilder()
    .setCustomId("amount")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g. $5")
    .setRequired(true);
  const amountLabel = new LabelBuilder().setLabel("Amount Donated").setTextInputComponent(amountInput);

  const transactionInput = new TextInputBuilder()
    .setCustomId("transactionId")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  const transactionLabel = new LabelBuilder()
    .setLabel("Transaction ID")
    .setTextInputComponent(transactionInput);

  const benefitInput = new TextInputBuilder()
    .setCustomId("benefitRequest")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(
      "e.g. Redeem x2, User Premium 1 month. Server Premium is given to the server you run this claim from.",
    )
    .setRequired(true);
  const benefitLabel = new LabelBuilder()
    .setLabel("Benefit(s) Requested")
    .setTextInputComponent(benefitInput);

  const proofUpload = new FileUploadBuilder()
    .setCustomId("proof")
    .setMinValues(1)
    .setMaxValues(1)
    .setRequired(true);
  const proofLabel = new LabelBuilder()
    .setLabel("Proof of Transaction")
    .setDescription("Screenshot of your transaction")
    .setFileUploadComponent(proofUpload);

  const modal = new ModalBuilder()
    .setCustomId("donation:claim")
    .setTitle("Donation Benefits Claim")
    .addLabelComponents(emailLabel, amountLabel, transactionLabel, benefitLabel, proofLabel);

  return interaction.showModal(modal);
}

async function handleClaimModalSubmit(interaction, client) {
  const email = interaction.fields.getTextInputValue("email").trim();
  const amount = interaction.fields.getTextInputValue("amount").trim();
  const transactionId = interaction.fields.getTextInputValue("transactionId").trim();
  const benefitRequest = interaction.fields.getTextInputValue("benefitRequest").trim();
  const uploadedFiles = interaction.fields.getUploadedFiles("proof");
  const screenshot = uploadedFiles?.first() ?? null;

  const claim = {
    id: makeClaimId(),
    userId: interaction.user.id,
    username: interaction.user.username,
    guildId: interaction.guild?.id ?? null,
    guildName: interaction.guild?.name ?? "Unknown (DM)",
    email: email || null,
    amount,
    transactionId,
    benefitRequest,
    screenshotUrl: screenshot?.url ?? null,
  };

  const reviewChannel = await fetchReviewChannel(client);
  if (!reviewChannel) {
    return interaction.reply({
      content: "A critical error occurred submitting your claim. Please contact developers.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`donation:accept:${claim.id}`)
      .setLabel("Accept")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`donation:reject:${claim.id}`)
      .setLabel("Reject")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger),
  );

  const sent = await reviewChannel.send({ content: `<@${OWNER_ID}>`, embeds: [claimEmbed(claim, interaction.user.tag)], components: [row] });
  claim.messageId = sent.id;
  await client.db.set(claimKey(claim.id), claim);

  return interaction.reply({
    content: `Your donation claim has been submitted for review - claim ID \`${claim.id}\`. Keep an eye on your DMs!`,
    flags: MessageFlags.Ephemeral,
  });
}

async function openRejectModal(interaction, claimId) {
  const modal = new ModalBuilder()
    .setCustomId(`donation:rejectModal:${claimId}`)
    .setTitle("Reject Donation Claim")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Rejection reason")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(300)
          .setRequired(true),
      ),
    );

  return interaction.showModal(modal);
}

async function finalizeReject(interaction, client, claimId) {
  const db = client.db;
  const reason = interaction.fields.getTextInputValue("reason").trim();

  const claim = await db.get(claimKey(claimId));
  if (!claim) return interaction.reply({ content: "This claim is no longer pending.", flags: MessageFlags.Ephemeral });

  await db.delete(claimKey(claimId));

  const submitter = await client.users.fetch(claim.userId).catch(() => null);
  let dmFailed = false;
  if (submitter) {
    try {
      await submitter.send(`Your donation claim (\`${claim.id}\`) has been rejected: ${reason}`);
    } catch {
      dmFailed = true;
    }
  } else {
    dmFailed = true;
  }

  const embed = claimEmbed(claim, submitter?.tag ?? claim.userId, {
    status: "rejected",
    note: reason + (dmFailed ? "\n\n*(User couldn't be DMed.)*" : ""),
  });

  try {
    const reviewChannel = await fetchReviewChannel(client);
    const original = await reviewChannel.messages.fetch(claim.messageId);
    await original.edit({
      embeds: [embed],
      components: [disabledRow(`Rejected by ${interaction.user.username}`, ButtonStyle.Danger, "❌")],
    });
  } catch (err) {
    console.error("Failed to update donation claim message after reject:", err);
  }

  return interaction.reply({ content: `Claim \`${claimId}\` rejected and the user notified.`, flags: MessageFlags.Ephemeral });
}

async function openGiveModal(interaction, claimId) {
  const redeemsInput = new TextInputBuilder()
    .setCustomId("redeems")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g. 2")
    .setRequired(false);
  const redeemsLabel = new LabelBuilder().setLabel("Redeem Quantity (optional)").setTextInputComponent(redeemsInput);

  const userPremiumInput = new TextInputBuilder()
    .setCustomId("userPremium")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g. 1mo, permanent")
    .setRequired(false);
  const userPremiumLabel = new LabelBuilder()
    .setLabel("User Premium Duration (optional)")
    .setTextInputComponent(userPremiumInput);

  const serverPremiumInput = new TextInputBuilder()
    .setCustomId("serverPremium")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g. 1mo, permanent")
    .setRequired(false);
  const serverPremiumLabel = new LabelBuilder()
    .setLabel("Server Premium Duration (optional)")
    .setDescription("Granted to the server the claim was filed from")
    .setTextInputComponent(serverPremiumInput);

  const notesInput = new TextInputBuilder()
    .setCustomId("notes")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);
  const notesLabel = new LabelBuilder()
    .setLabel("Notes (optional)")
    .setTextInputComponent(notesInput);

  const modal = new ModalBuilder()
    .setCustomId(`donation:giveModal:${claimId}`)
    .setTitle("Grant Donation Benefits")
    .addLabelComponents(redeemsLabel, userPremiumLabel, serverPremiumLabel, notesLabel);

  return interaction.showModal(modal);
}

async function finalizeAccept(interaction, client, claimId) {
  const db = client.db;
  const claim = await db.get(claimKey(claimId));
  if (!claim) return interaction.reply({ content: "This claim is no longer pending.", flags: MessageFlags.Ephemeral });

  const redeemsInput = interaction.fields.getTextInputValue("redeems").trim();
  const userPremiumInput = interaction.fields.getTextInputValue("userPremium").trim();
  const serverPremiumInput = interaction.fields.getTextInputValue("serverPremium").trim();
  const notes = interaction.fields.getTextInputValue("notes").trim();

  let redeemQty = null;
  if (redeemsInput) {
    redeemQty = parseInt(redeemsInput, 10);
    if (!Number.isInteger(redeemQty) || redeemQty < 1) {
      return interaction.reply({ content: "Redeem quantity must be a positive whole number.", flags: MessageFlags.Ephemeral });
    }
  }

  let userPremiumSpec = null;
  if (userPremiumInput) {
    userPremiumSpec = parseDurationSpec(normalizeDurationInput(userPremiumInput));
    if (!userPremiumSpec) {
      return interaction.reply({ content: "Couldn't understand the User Premium duration.", flags: MessageFlags.Ephemeral });
    }
  }

  let serverPremiumSpec = null;
  if (serverPremiumInput) {
    if (!claim.guildId) {
      return interaction.reply({
        content: "This claim wasn't filed from a server (it came from a DM), so Server Premium can't be granted for it.",
        flags: MessageFlags.Ephemeral,
      });
    }
    serverPremiumSpec = parseDurationSpec(normalizeDurationInput(serverPremiumInput));
    if (!serverPremiumSpec) {
      return interaction.reply({ content: "Couldn't understand the Server Premium duration.", flags: MessageFlags.Ephemeral });
    }
  }

  if (!redeemQty && !userPremiumSpec && !serverPremiumSpec) {
    return interaction.reply({ content: "Please specify at least one benefit to grant.", flags: MessageFlags.Ephemeral });
  }

  const grants = [];

  if (redeemQty) {
    await db.add(`redeem_${claim.userId}`, redeemQty);
    grants.push(`🎟️ ${redeemQty} Redeem${redeemQty !== 1 ? "s" : ""}`);
  }

  if (userPremiumSpec) {
    const expiry = resolveDurationSpec(userPremiumSpec);
    await db.set(`userpremium_${claim.userId}`, true);
    await db.set(`userpremiumtime_${claim.userId}`, expiry);
    grants.push(`⭐ User Premium (${describeGrantedDuration(userPremiumSpec)})`);
  }

  if (serverPremiumSpec) {
    const expiry = resolveDurationSpec(serverPremiumSpec);
    await db.set(`serverpremium_${claim.guildId}`, true);
    await db.set(`serverpremiumtime_${claim.guildId}`, expiry);
    grants.push(`🏆 Server Premium for **${claim.guildName}** (${describeGrantedDuration(serverPremiumSpec)})`);
  }

  await db.delete(claimKey(claimId));

  const grantsList = grants.join("\n");
  const submitter = await client.users.fetch(claim.userId).catch(() => null);
  let dmFailed = false;
  if (submitter) {
    try {
      await submitter.send(
        `Your donation claim (\`${claim.id}\`) has been approved! You received:\n${grantsList}${notes ? `\n\nNote from the team: ${notes}` : ""}`,
      );
    } catch {
      dmFailed = true;
    }
  } else {
    dmFailed = true;
  }

  const embed = claimEmbed(claim, submitter?.tag ?? claim.userId, {
    status: "approved",
    note: grantsList + (notes ? `\n\n**Notes:** ${notes}` : "") + (dmFailed ? "\n\n*(User couldn't be DMed.)*" : ""),
  });

  try {
    const reviewChannel = await fetchReviewChannel(client);
    const original = await reviewChannel.messages.fetch(claim.messageId);
    await original.edit({
      embeds: [embed],
      components: [disabledRow(`Approved by ${interaction.user.username}`, ButtonStyle.Success, "✅")],
    });
  } catch (err) {
    console.error("Failed to update donation claim message after accept:", err);
  }

  return interaction.reply({ content: "Benefits granted and the user has been notified.", flags: MessageFlags.Ephemeral });
}