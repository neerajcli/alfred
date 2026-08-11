const {
  SlashCommandBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

const TARGET_CHANNEL_ID = "1478004017513762838";

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Open a support ticket to contact our team."),

  allowPrefix: false,

  async execute(ctx, client) {
    const modal = new ModalBuilder()
      .setCustomId("support:ticket")
      .setTitle("Contact Support")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("email")
            .setLabel("Email (optional)")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setPlaceholder("you@example.com - leave blank if you'd rather not share")
            .setRequired(false),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("inServer")
            .setLabel("Specific server issue?")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setPlaceholder("If yes, specify the server ID. If no, just put No.")
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("issue")
            .setLabel("Describe your issue")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1000)
            .setPlaceholder("Include as much detail as you can so we can help quickly.")
            .setRequired(true),
        ),
      );

    return ctx.raw.showModal(modal);
  },

  async handleModal(interaction, client) {
    const [, kind, ticketUserId, messageId] = interaction.customId.split(":");
    if (kind === "ticket") return handleTicketSubmit(interaction, client);
    if (kind === "replyModal") return handleReplySubmit(interaction, client, ticketUserId, messageId);
  },

  async handleButton(interaction, client) {
    const [, action, ticketUserId, messageId] = interaction.customId.split(":");
    if (action !== "reply") return;

    if (!client.owners.includes(interaction.user.id)) {
      return interaction.reply({
        content: "You don't have permission to reply to support tickets.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`support:replyModal:${ticketUserId}:${messageId}`)
      .setTitle("Reply to Support Ticket")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("replyText")
            .setLabel("Your reply")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(2000)
            .setPlaceholder("This will be sent to the user via DM.")
            .setRequired(true),
        ),
      );

    return interaction.showModal(modal);
  },
};

async function fetchTargetChannel(client) {
  return client.channels.cache.get(TARGET_CHANNEL_ID) || (await client.channels.fetch(TARGET_CHANNEL_ID).catch(() => null));
}

async function handleTicketSubmit(interaction, client) {
  const email = interaction.fields.getTextInputValue("email") || "N/A";
  const inServer = interaction.fields.getTextInputValue("inServer");
  const issue = interaction.fields.getTextInputValue("issue");

  const targetChannel = await fetchTargetChannel(client);
  if (!targetChannel) {
    return interaction.reply({
      content: "A critical error occurred. Please contact developers.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
    .setTitle("🎫 New Support Ticket")
    .addFields(
      { name: "User", value: `${interaction.user} (${interaction.user.id})`, inline: true },
      { name: "Sent From", value: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : "DM", inline: true },
      { name: "Email", value: email, inline: true },
      { name: "Specific Server Issue?", value: inServer || "N/A", inline: true },
      { name: "Issue", value: issue.slice(0, 1024) },
    )
    .setColor(0xf1c40f)
    .setFooter({ text: "Responses collected by Alfred" })
    .setTimestamp();

  const ownerMentions = client.owners.map((id) => `<@${id}>`).join(" ");

  const sentMessage = await targetChannel.send({ content: ownerMentions, embeds: [embed] });

  const replyRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`support:reply:${interaction.user.id}:${sentMessage.id}`)
      .setLabel("Reply")
      .setEmoji("↩️")
      .setStyle(ButtonStyle.Primary),
  );
  await sentMessage.edit({ components: [replyRow] });

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("✅ Ticket Submitted")
        .setDescription("We've received your query and will resolve it ASAP!")
        .setColor(0x57f287)
        .setTimestamp(),
    ],
    flags: MessageFlags.Ephemeral,
  });
}

async function handleReplySubmit(interaction, client, ticketUserId, messageId) {
  const replyText = interaction.fields.getTextInputValue("replyText");

  let ticketUser;
  try {
    ticketUser = await client.users.fetch(ticketUserId);
  } catch {
    return interaction.reply({
      content: "Couldn't find that user anymore - they may have deleted their account.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const dmEmbed = new EmbedBuilder()
    .setTitle("📬 Reply to Your Support Ticket")
    .setDescription(replyText)
    .setFooter({ text: `Replied by ${interaction.user.tag}` })
    .setColor(0x5865f2)
    .setTimestamp();

  let dmFailed = false;
  try {
    await ticketUser.send({ embeds: [dmEmbed] });
  } catch {
    dmFailed = true;
  }

  if (messageId) {
    try {
      const targetChannel = await fetchTargetChannel(client);
      const originalMessage = await targetChannel?.messages.fetch(messageId);
      if (originalMessage) {
        const repliedRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`support:replied:${ticketUserId}`)
            .setLabel(`Replied by ${interaction.user.username}`)
            .setEmoji("✅")
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
        );
        await originalMessage.edit({ components: [repliedRow] });
      }
    } catch (err) {
      console.error("Failed to mark support ticket as replied:", err);
    }
  }

  return interaction.reply({
    content: dmFailed
      ? "⚠️ Reply recorded, but I couldn't DM the user (their DMs may be closed)."
      : "✅ Reply sent to the user via DM!",
    flags: MessageFlags.Ephemeral,
  });
}