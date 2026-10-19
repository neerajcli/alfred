const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require("discord.js");
const { parseExpiry, formatExpiry, isExpired } = require("../utils/time");
const { syncEnforcement } = require("./wordmod");

const REPORT_CHANNEL_ID = "750667085625032795";
const BUG_REWARD = 50;

function disabledRow(label, style, emoji) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("report:done")
      .setLabel(label)
      .setEmoji(emoji)
      .setStyle(style)
      .setDisabled(true),
  );
}

async function fetchReportChannel(client) {
  return (
    client.channels.cache.get(REPORT_CHANNEL_ID) || (await client.channels.fetch(REPORT_CHANNEL_ID).catch(() => null))
  );
}

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a bug, user, or server to the developers.")
    .addSubcommand((sub) =>
      sub
        .setName("bug")
        .setDescription("Report a bug you found - accepted reports earn 50 redeems!")
        .addStringOption((opt) => opt.setName("bug").setDescription("Describe the bug").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("user")
        .setDescription("Report a user for misconduct")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to report").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Why you're reporting them").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("server")
        .setDescription("Report a server for misconduct")
        .addStringOption((opt) => opt.setName("server-id").setDescription("The server's ID").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Why you're reporting it").setRequired(true)),
    ),

  allowPrefix: true,
  optionOrder: ["_subcommand", "user"],

  async execute(ctx, client) {
    const sub = ctx.getSubcommand();
    if (sub === "bug") return handleBugReport(ctx, client);
    if (sub === "user") return handleUserReport(ctx, client);
    if (sub === "server") return handleServerReport(ctx, client);
    return ctx.reply("Usage: `/report <bug|user|server>`");
  },

  async handleButton(interaction, client) {
    if (!client.owners.includes(interaction.user.id)) {
      return interaction.reply({ content: "You don't have permission to review reports.", flags: MessageFlags.Ephemeral });
    }

    const [, action, type, targetId] = interaction.customId.split(":");

    if (action === "accept" && type === "bug") return openBugAcceptModal(interaction, targetId);
    if (action === "reject" && type === "bug") return rejectGeneric(interaction, "Bug Report", "No redeems were awarded.");

    if (action === "reject" && (type === "user" || type === "server")) {
      return rejectGeneric(interaction, `${type === "user" ? "User" : "Server"} Report`, "No action was taken.");
    }

    if (action === "accept" && (type === "user" || type === "server")) {
      return openBlacklistModal(interaction, type, targetId);
    }
  },

  async handleModal(interaction, client) {
    const [, kind, type, targetId, messageId] = interaction.customId.split(":");
    if (kind !== "acceptModal") return;
    if (type === "bug") return finalizeBugAccept(interaction, client, targetId, messageId);
    return finalizeBlacklist(interaction, client, type, targetId, messageId);
  },
};

async function handleBugReport(ctx, client) {
  const bug = (ctx.source === "slash" ? ctx.getString("bug") : ctx.restText)?.trim();
  if (!bug) return ctx.reply("Please describe the bug you found.");

  const channel = await fetchReportChannel(client);
  if (!channel) return ctx.reply("A critical error occurred. Please contact developers.");

  const embed = new EmbedBuilder()
    .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
    .setTitle("🐛 New Bug Report")
    .addFields({ name: "Reported By", value: `${ctx.user} (${ctx.user.id})` }, { name: "Bug", value: bug.slice(0, 1000) })
    .setColor(0xfee75c)
    .setFooter({ text: `🎁 Awards ${BUG_REWARD} redeems if accepted` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`report:accept:bug:${ctx.user.id}`)
      .setLabel("Accept")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`report:reject:bug:${ctx.user.id}`)
      .setLabel("Reject")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger),
  );
  const ownerMentions = client.owners.map((id) => `<@${id}>`).join(" ");

  await channel.send({ content: ownerMentions, embeds: [embed], components: [row] });
  return ctx.reply(`Your bug report has been sent to the developers. Thanks for helping improve the bot - accepted reports earn **${BUG_REWARD} redeems**!`);
}

async function handleUserReport(ctx, client) {
  let target = ctx.getUser("user");
  if (!target && ctx.source === "message") {
    const rawId = ctx.restText?.split(/ +/)[0]?.replace(/[<@!>]/g, "");
    if (rawId) target = await client.users.fetch(rawId).catch(() => null);
  }
  if (!target) return ctx.reply("Please mention someone to report, or provide their user ID.");
  if (target.id === ctx.user.id) return ctx.reply("You can't report yourself!");
  if (target.bot) return ctx.reply("You can't report a bot!");

  const isBlacklisted = (await client.db.get(`bl_${target.id}`)) === true;
  if (isBlacklisted) {
    const expiry = await client.db.get(`bltime_${target.id}`);
    if (!isExpired(expiry)) {
      return ctx.reply(`**${target.username}** is already blacklisted (expires: ${formatExpiry(expiry)}). No need to report them again.`);
    }
  }

  const reason = (ctx.source === "slash" ? ctx.getString("reason") : ctx.restText.split(/ +/).slice(1).join(" "))?.trim();
  if (!reason) return ctx.reply("Please provide a reason for the report.");

  const channel = await fetchReportChannel(client);
  if (!channel) return ctx.reply("A critical error occurred. Please contact developers.");

  const embed = new EmbedBuilder()
    .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
    .setTitle("🚩 New User Report")
    .addFields(
      { name: "Reported By", value: `${ctx.user} (${ctx.user.id})`, inline: true },
      { name: "Reported User", value: `${target} (${target.id})`, inline: true },
      { name: "Reason", value: reason.slice(0, 1000) },
    )
    .setColor(0xe67e22)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`report:accept:user:${target.id}`)
      .setLabel("Accept")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`report:reject:user:${target.id}`)
      .setLabel("Reject")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger),
  );

  const ownerMentions = client.owners.map((id) => `<@${id}>`).join(" ");
  await channel.send({ content: ownerMentions, embeds: [embed], components: [row] });
  return ctx.reply("Your report has been sent to the developers for review. Thank you!");
}

async function handleServerReport(ctx, client) {
  const serverId = (ctx.source === "slash" ? ctx.getString("server-id") : ctx.restText?.split(/ +/)[0])?.trim();
  if (!serverId || !client.guilds.cache.get(serverId)) {
    return ctx.reply("Please provide a valid server ID.");
  }

  const isGuildBlacklisted = (await client.db.get(`blguild_${serverId}`)) === true;
  if (isGuildBlacklisted) {
    const expiry = await client.db.get(`blguildtime_${serverId}`);
    if (!isExpired(expiry)) {
      return ctx.reply(`This server is already blacklisted (expires: ${formatExpiry(expiry)}). No need to report it again.`);
    }
  }

  const reason = (ctx.source === "slash" ? ctx.getString("reason") : ctx.restText.split(/ +/).slice(1).join(" "))?.trim();
  if (!reason) return ctx.reply("Please provide a reason for the report.");

  const channel = await fetchReportChannel(client);
  if (!channel) return ctx.reply("A critical error occurred. Please contact developers.");

  const embed = new EmbedBuilder()
    .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
    .setTitle("🚩 New Server Report")
    .addFields(
      { name: "Reported By", value: `${ctx.user} (${ctx.user.id})`, inline: true },
      { name: "Server ID", value: serverId, inline: true },
      { name: "Reason", value: reason.slice(0, 1000) },
    )
    .setColor(0xe67e22)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`report:accept:server:${serverId}`)
      .setLabel("Accept")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`report:reject:server:${serverId}`)
      .setLabel("Reject")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger),
  );

  const ownerMentions = client.owners.map((id) => `<@${id}>`).join(" ");
  await channel.send({ content: ownerMentions, embeds: [embed], components: [row] });
  return ctx.reply("Your report has been sent to the developers for review. Thank you!");
}

async function openBugAcceptModal(interaction, reporterId) {
  const messageId = interaction.message.id;
  const bugField = interaction.message.embeds[0]?.fields.find((f) => f.name === "Bug");
  const originalBugText = bugField?.value ?? "";

  const modal = new ModalBuilder()
    .setCustomId(`report:acceptModal:bug:${reporterId}:${messageId}`)
    .setTitle("Accept Bug Report")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("knownBugEntry")
          .setLabel("Known bug entry (clear to skip)")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setValue(originalBugText)
          .setPlaceholder("Edit as needed, or delete all text to accept without listing it publicly.")
          .setRequired(false),
      ),
    );

  return interaction.showModal(modal);
}

async function finalizeBugAccept(interaction, client, reporterId, messageId) {
  const db = client.db;
  const knownBugEntry = interaction.fields.getTextInputValue("knownBugEntry").trim();

  await db.add("redeem_" + reporterId, BUG_REWARD);

  let addedToList = false;
  if (knownBugEntry) {
    const bugs = (await db.get("knownbugs")) || [];
    bugs.push(knownBugEntry);
    await db.set("knownbugs", bugs);
    addedToList = true;
  }

  let dmFailed = false;
  try {
    const reporter = await client.users.fetch(reporterId);
    await reporter.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎉 Bug Report Accepted!")
          .setDescription(`Thank you for reporting a bug - it's been accepted and you've been awarded **${BUG_REWARD} redeems**!`)
          .setColor(0x57f287)
          .setTimestamp(),
      ],
    });
  } catch {
    dmFailed = true;
  }

  try {
    const original = await interaction.channel.messages.fetch(messageId);
    const embed = EmbedBuilder.from(original.embeds[0])
      .setTitle("✅ Bug Report Accepted")
      .setColor(0x57f287)
      .addFields(
        { name: "Reward", value: `+${BUG_REWARD} redeems awarded${dmFailed ? " (DM failed - their DMs may be closed)" : ""}` },
        { name: "Known Bugs List", value: addedToList ? "✅ Added" : "Not added" },
      );

    await original.edit({
      embeds: [embed],
      components: [disabledRow(`Accepted by ${interaction.user.username}`, ButtonStyle.Success, "✅")],
    });
  } catch (err) {
    console.error("Failed to update report message after bug accept:", err);
  }

  return interaction.reply({
    content: `✅ Bug report accepted. ${BUG_REWARD} redeems awarded${dmFailed ? " (DM failed)" : ""}.${addedToList ? " Added to `/knownbugs`." : ""}`,
    flags: MessageFlags.Ephemeral,
  });
}

async function rejectGeneric(interaction, typeLabel, noteText) {
  const original = interaction.message.embeds[0];
  const embed = EmbedBuilder.from(original)
    .setTitle(`❌ ${typeLabel} Rejected`)
    .setColor(0xed4245)
    .addFields({ name: "Outcome", value: noteText });

  await interaction.update({ embeds: [embed], components: [disabledRow(`Rejected by ${interaction.user.username}`, ButtonStyle.Danger, "❌")] });
}

async function openBlacklistModal(interaction, type, targetId) {
  const messageId = interaction.message.id;

  const modal = new ModalBuilder()
    .setCustomId(`report:acceptModal:${type}:${targetId}:${messageId}`)
    .setTitle(`Blacklist ${type === "user" ? "User" : "Server"}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Blacklist reason")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(300)
          .setPlaceholder("Why is this being blacklisted?")
          .setRequired(true),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("duration")
          .setLabel("Duration")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(20)
          .setPlaceholder("e.g. 24h, 7d, 30d, never")
          .setRequired(true),
      ),
    );

  return interaction.showModal(modal);
}

async function finalizeBlacklist(interaction, client, type, targetId, messageId) {
  const db = client.db;
  const reason = interaction.fields.getTextInputValue("reason").trim();
  const durationInput = interaction.fields.getTextInputValue("duration").trim();

  const parsed = parseExpiry(durationInput);
  if (!parsed) {
    return interaction.reply({
      content: "I couldn't understand that duration. Use something like `24h`, `7d`, `30d`, or `never`, then click Accept again.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const storedExpiry = parsed.never ? "never" : parsed.timestamp;

  if (type === "user") {
    await db.set(`bl_${targetId}`, true);
    await db.set(`bltime_${targetId}`, storedExpiry);
    await db.set(`blreason_${targetId}`, reason);
  } else {
    await db.set(`blguild_${targetId}`, true);
    await db.set(`blguildtime_${targetId}`, storedExpiry);
    await db.set(`blguildreason_${targetId}`, reason);
    await syncEnforcement(client, targetId).catch((err) =>
      console.error(`Failed to sync word moderation after blacklisting ${guild.id}:`, err),
    );
  }

  try {
    const original = await interaction.channel.messages.fetch(messageId);
    const embed = EmbedBuilder.from(original.embeds[0])
      .setTitle(`✅ ${type === "user" ? "User" : "Server"} Report Accepted`)
      .setColor(0x57f287)
      .addFields(
        { name: "Blacklist Reason", value: reason },
        { name: "Expires", value: formatExpiry(storedExpiry) },
      );

    await original.edit({
      embeds: [embed],
      components: [disabledRow(`Accepted by ${interaction.user.username}`, ButtonStyle.Success, "✅")],
    });
  } catch (err) {
    console.error("Failed to update report message after blacklist:", err);
  }

  return interaction.reply({
    content: `✅ ${type === "user" ? "User" : "Server"} \`${targetId}\` has been blacklisted (expires: ${formatExpiry(storedExpiry)}).`,
    flags: MessageFlags.Ephemeral,
  });
}