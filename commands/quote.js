const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const { requireGuildPremium } = require("../utils/premium");

function truncateDescription(text, max = 4000) {
  if (!text) return "*This message has no text content.*";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

module.exports = {
  category: "Server Premium",
  data: new SlashCommandBuilder()
    .setName("quote")
    .setDescription("Quote a message from any channel in this server.")
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("The channel the message is in")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("message_id")
        .setDescription("The ID of the message to quote")
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  allowPrefix: true,
  optionOrder: ["channel", "message_id"],

  async execute(ctx, client) {
    if (!ctx.guild) return ctx.reply("This command can only be used in a server.");

    if (!(await requireGuildPremium(ctx, client))) return;

    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return ctx.reply("You need the **Manage Channels** permission to use this.");
    }

    let targetChannel;
    let messageId;

    if (ctx.source === "slash") {
      targetChannel = ctx.raw.options.getChannel("channel");
      messageId = ctx.getString("message_id");
    } else {
      const tokens = ctx.raw.content.split(/\s+/).slice(1);
      const mentionedChannel = ctx.raw.mentions.channels.first();

      if (mentionedChannel) {
        targetChannel = mentionedChannel;
        messageId = tokens.find((t) => t !== `<#${mentionedChannel.id}>`);
      } else {
        for (const token of tokens) {
          try {
            const fetched = await client.channels.fetch(token);
            if (fetched?.isTextBased?.()) {
              targetChannel = fetched;
              messageId = tokens.find((t) => t !== token);
              break;
            }
          } catch {
          }
        }
      }

      if (!targetChannel || !messageId) {
        return ctx.reply(
          "Please provide a message ID and mention the channel it's in. Correct format: `quote #channel <message id>`",
        );
      }
    }

    if (!targetChannel?.isTextBased?.()) {
      return ctx.reply("Please provide a valid text channel.");
    }

    const botPerms = targetChannel.permissionsFor(ctx.guild.members.me);
    if (!botPerms?.has(PermissionFlagsBits.ViewChannel) || !botPerms?.has(PermissionFlagsBits.ReadMessageHistory)) {
      return ctx.reply(`I don't have permission to read messages in ${targetChannel}.`);
    }

    let quoted;
    try {
      quoted = await targetChannel.messages.fetch(messageId);
    } catch {
      quoted = null;
    }

    if (!quoted) {
      return ctx.reply("Couldn't find that message - double check the ID and channel and try again.");
    }

    const jumpLink = `https://discord.com/channels/${ctx.guild.id}/${targetChannel.id}/${quoted.id}`;
    const imageAttachment = quoted.attachments.find((a) => a.contentType?.startsWith("image/"));
    const otherAttachments = quoted.attachments.filter((a) => a.id !== imageAttachment?.id);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: quoted.author.tag,
        iconURL: quoted.author.displayAvatarURL(),
      })
      .setDescription(truncateDescription(quoted.content))
      .addFields(
        { name: "Channel", value: `${targetChannel}`, inline: true },
        { name: "Sent", value: `<t:${Math.floor(quoted.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "\u200b", value: `[Jump to Message](${jumpLink})` },
      )
      .setColor(0x5865f2)
      .setFooter({ text: `Requested by ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
      .setTimestamp();

    if (imageAttachment) embed.setImage(imageAttachment.url);
    if (otherAttachments.size) {
      embed.addFields({
        name: "Attachments",
        value: `${otherAttachments.size} additional attachment${otherAttachments.size !== 1 ? "s" : ""} (see original message)`,
      });
    }

    return ctx.reply({ embeds: [embed] });
  },
};