const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");

const optOutKey = (userId) => `messagesoptout_${userId}`;

function statusEmbed(title, description, color) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

function buildConfirmRow(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`settings:confirmdelete:${userId}`)
      .setLabel("Yes, delete everything")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`settings:canceldelete:${userId}`)
      .setLabel("Cancel")
      .setEmoji("✖️")
      .setStyle(ButtonStyle.Secondary),
  );
}

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Manage your data and messaging preferences.")
    .addSubcommand((sub) =>
      sub.setName("data-delete").setDescription("Permanently delete all of your stored data. This can't be undone."),
    )
    .addSubcommand((sub) =>
      sub.setName("opt-out-messages").setDescription("Stop the bot from treating your prefix messages as commands."),
    )
    .addSubcommand((sub) =>
      sub.setName("opt-in-messages").setDescription("Re-enable prefix commands (this is the default)."),
    )
    .addSubcommand((sub) =>
      sub.setName("block-dms").setDescription("Stop other members from DMing you through the bot (via /dm)."),
    )
    .addSubcommand((sub) =>
      sub.setName("unblock-dms").setDescription("Allow other members to DM you through the bot again (this is the default)."),
    ),

  allowPrefix: true,

  async execute(ctx, client) {
    const sub = ctx.getSubcommand();
    if (sub === "data-delete") return handleDataDelete(ctx, client);
    if (sub === "opt-out-messages") return handleOptOut(ctx, client);
    if (sub === "opt-in-messages") return handleOptIn(ctx, client);
    if (sub === "block-dms") return handleBlockDms(ctx, client);
    if (sub === "unblock-dms") return handleUnblockDms(ctx, client);

    return ctx.reply("Usage: `/settings <data-delete|opt-out-messages|opt-in-messages|block-dms|unblock-dms>`");
  },

  async handleButton(interaction, client) {
    const [, action, userId] = interaction.customId.split(":");

    if (interaction.user.id !== userId) {
      return interaction.reply({ content: "This confirmation isn't for you.", flags: MessageFlags.Ephemeral });
    }

    if (action === "canceldelete") {
      return interaction.update({
        embeds: [statusEmbed("❌ Cancelled", "Data deletion request cancelled. Nothing was deleted.", 0x5865f2)],
        components: [],
      });
    }

    if (action === "confirmdelete") {
      await interaction.update({
        embeds: [statusEmbed("🗑️ Deleting…", "Please wait, deleting all your data. This may take a moment.", 0xfee75c)],
        components: [],
      });

      const db = client.db;
      const allEntries = await db.all();

      const keys = allEntries
        .map((entry) => entry.id)
        .filter((id) => id.split("_").some((segment) => segment.includes(userId)));

      for (const key of keys) {
        await db.delete(key);
      }

      const resultEmbed = statusEmbed(
        "✅ Data Deleted",
        `Successfully deleted **${keys.length}** stored record(s). Your progress, economy status, and preferences have all been reset to default.`,
        0x57f287,
      );

      try {
        await interaction.editReply({ embeds: [resultEmbed], components: [] });
      } catch (err) {
        console.error("Failed to confirm data deletion:", err);
      }
    }
  },
};

async function handleDataDelete(ctx, client) {
  const embed = statusEmbed(
    "⚠️ Delete All Your Data?",
    [
      "This will permanently delete **all** of your stored data on this bot - economy balances, preferences, premium status and progress.",
      "",
      "**This can't be reversed.**",
    ].join("\n"),
    0xed4245,
  );

  return ctx.reply({ embeds: [embed], components: [buildConfirmRow(ctx.user.id)] });
}

async function handleOptOut(ctx, client) {
  const db = client.db;

  const alreadyOptedOut = (await db.get(optOutKey(ctx.user.id))) === true;
  if (alreadyOptedOut) {
    return ctx.reply({ embeds: [statusEmbed("🔕 Already Opted Out", "You've already opted out of prefix commands.", 0xfee75c)] });
  }

  await db.set(optOutKey(ctx.user.id), true);

  const embed = statusEmbed(
    "🔕 Opted Out",
    [
      "Your prefix messages will no longer be treated as commands.",
      `Slash commands still work, and so does mentioning me (\`@${client.user.username} <command>\`).`,
      `Run ${client.mentionCommand("settings opt-in-messages")} any time to turn this back on.`,
    ].join("\n"),
    0x57f287,
  );
  return ctx.reply({ embeds: [embed] });
}

async function handleOptIn(ctx, client) {
  const db = client.db;

  const optedOut = (await db.get(optOutKey(ctx.user.id))) === true;
  if (!optedOut) {
    return ctx.reply({ embeds: [statusEmbed("🔔 Already Opted In", "Prefix commands are already enabled for you.", 0xfee75c)] });
  }

  await db.delete(optOutKey(ctx.user.id));

  return ctx.reply({ embeds: [statusEmbed("🔔 Opted Back In", "Prefix commands are enabled again - welcome back!", 0x57f287)] });
}

const dmBlockKey = (userId) => `dmblock_${userId}`;

async function handleBlockDms(ctx, client) {
  const db = client.db;

  const alreadyBlocked = (await db.get(dmBlockKey(ctx.user.id))) === true;
  if (alreadyBlocked) {
    return ctx.reply({ embeds: [statusEmbed("🚫 Already Blocked", "You've already blocked bot-relayed DMs from other members.", 0xfee75c)] });
  }

  await db.set(dmBlockKey(ctx.user.id), true);

  const embed = statusEmbed(
    "🚫 DMs Blocked",
    [
      `Other members can no longer DM you through the bot (via ${client.mentionCommand("dm")}).`,
      `Run ${client.mentionCommand("settings unblock-dms")} any time to allow it again.`,
    ].join("\n"),
    0x57f287,
  );
  return ctx.reply({ embeds: [embed] });
}

async function handleUnblockDms(ctx, client) {
  const db = client.db;

  const blocked = (await db.get(dmBlockKey(ctx.user.id))) === true;
  if (!blocked) {
    return ctx.reply({ embeds: [statusEmbed("✅ Already Allowed", "Bot-relayed DMs from other members are already allowed.", 0xfee75c)] });
  }

  await db.delete(dmBlockKey(ctx.user.id));

  return ctx.reply({ embeds: [statusEmbed("✅ DMs Unblocked", "Other members can DM you through the bot again.", 0x57f287)] });
}