const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Post an announcement to a channel.")
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Channel to announce in")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addStringOption((opt) => opt.setName("message").setDescription("What to announce").setRequired(true))
    .addStringOption((opt) => opt.setName("title").setDescription("Custom title (defaults to 'New Announcement')").setRequired(false)),

  allowPrefix: true,

  async execute(ctx, client) {
    const canManage = ctx.raw.member?.permissions?.has(PermissionFlagsBits.ManageChannels);
    if (!canManage) return ctx.reply("You can't do this!");

    let channel;
    let announceText;
    let customTitle;

    if (ctx.source === "slash") {
      channel = ctx.raw.options.getChannel("channel");
      announceText = ctx.getString("message");
      customTitle = ctx.getString("title");
    } else {
      const parts = (ctx.fullText || "").split(/ +/).filter(Boolean);
      const channelId = parts[0]?.replace(/[<#>]/g, "");
      channel = channelId ? ctx.guild.channels.cache.get(channelId) : null;

      const remainder = ctx.restText?.trim() || "";
      const quotedTitleMatch = remainder.match(/^"([^"]+)"\s*([\s\S]*)$/);
      if (quotedTitleMatch) {
        customTitle = quotedTitleMatch[1];
        announceText = quotedTitleMatch[2];
      } else {
        announceText = remainder;
      }
    }

    if (!channel) return ctx.reply("Please mention a valid channel.");
    if (!channel.isTextBased?.()) return ctx.reply("That channel isn't a text channel I can send messages in.");
    if (!announceText) return ctx.reply("Please provide an announcement!");

    const botCanSend = channel.permissionsFor(client.user)?.has(PermissionFlagsBits.SendMessages);
    if (!botCanSend) return ctx.reply(`I don't have permission to send messages in ${channel}.`);

    const embed = new EmbedBuilder()
      .setTitle(`📢 ${customTitle?.trim() || "New Announcement"}`)
      .setDescription(announceText)
      .setColor(0x5865f2)
      .setFooter({ text: `Announced by ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
      .setTimestamp();

    try {
      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Failed to send announcement:", err);
      return ctx.reply("Something went wrong sending that announcement.");
    }

    return ctx.reply({
      embeds: [new EmbedBuilder().setDescription(`✅ Announcement sent to ${channel}.`).setColor(0x57f287)],
    });
  },
};