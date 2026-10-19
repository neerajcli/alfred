const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

const enabledKey = (guildId) => `le_${guildId}`;
const channelSetKey = (guildId) => `ls_${guildId}`;
const channelKey = (guildId) => `lc_${guildId}`;

function statusEmbed(title, description, color) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

async function requireManageChannels(ctx) {
  const canManage = ctx.raw.member?.permissions?.has(PermissionFlagsBits.ManageChannels);
  if (!canManage) {
    await ctx.reply({
      embeds: [statusEmbed("🚫 Missing Permission", "You need the **Manage Channels** permission to do that.", 0xed4245)],
    });
    return false;
  }
  return true;
}

module.exports = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("leaver")
    .setDescription("Leave message system.")
    .addSubcommand((sub) => sub.setName("on").setDescription("Enable leave messages for this server."))
    .addSubcommand((sub) => sub.setName("off").setDescription("Disable leave messages for this server."))
    .addSubcommand((sub) =>
      sub
        .setName("channel")
        .setDescription("Set the channel leave messages are posted in.")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel to post leave messages in")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        ),
    ),

  allowPrefix: true,

  async execute(ctx, client) {
    if (!ctx.guild) return ctx.reply("This command can only be used inside a server.");

    const sub = ctx.getSubcommand();
    if (sub === "on") return handleOn(ctx, client);
    if (sub === "off") return handleOff(ctx, client);
    if (sub === "channel") return handleSetChannel(ctx, client);

    return ctx.reply("Usage: `/leaver <on|off|channel>`");
  },
};

async function handleOn(ctx, client) {
  if (!(await requireManageChannels(ctx))) return;
  const db = client.db;

  const alreadyOn = await db.get(enabledKey(ctx.guild.id));
  if (alreadyOn === true) {
    return ctx.reply({ embeds: [statusEmbed("👋 Leaver", "Leave messages are already enabled here.", 0xfee75c)] });
  }

  await db.set(enabledKey(ctx.guild.id), true);

  return ctx.reply({
    embeds: [
      statusEmbed(
        "👋 Leaver Enabled",
        "Departures will now be announced. Next, set a channel:\n" +
        "`/leaver channel channel:<#channel>` or `a!leaver channel <#channel>`",
        0x57f287,
      ),
    ],
  });
}

async function handleOff(ctx, client) {
  if (!(await requireManageChannels(ctx))) return;
  const db = client.db;

  const isOn = await db.get(enabledKey(ctx.guild.id));
  if (isOn !== true) {
    return ctx.reply({ embeds: [statusEmbed("👋 Leaver", "Leave messages aren't enabled here.", 0xfee75c)] });
  }

  await db.set(enabledKey(ctx.guild.id), false);
  return ctx.reply({
    embeds: [statusEmbed("🔇 Leaver Disabled", "Leave messages have been turned off for this server.", 0x57f287)],
  });
}

async function handleSetChannel(ctx, client) {
  if (!(await requireManageChannels(ctx))) return;
  const db = client.db;

  const isOn = await db.get(enabledKey(ctx.guild.id));
  if (isOn !== true) {
    return ctx.reply({ embeds: [statusEmbed("👋 Leaver", "Enable leave messages first with `/leaver on`.", 0xed4245)] });
  }

  let channel;
  if (ctx.source === "slash") {
    channel = ctx.raw.options.getChannel("channel");
  } else {
    const channelId = ctx.restText?.trim().replace(/[<#>]/g, "");
    channel = channelId ? ctx.guild.channels.cache.get(channelId) : null;
  }

  if (!channel) return ctx.reply("Please mention a valid channel.");
  if (!channel.isTextBased?.()) return ctx.reply("That channel isn't a text channel I can send messages in.");

  const botCanSend = channel.permissionsFor(client.user)?.has(PermissionFlagsBits.SendMessages);
  if (!botCanSend) return ctx.reply(`I don't have permission to send messages in ${channel}.`);

  await db.set(channelKey(ctx.guild.id), channel.id);
  await db.set(channelSetKey(ctx.guild.id), true);

  return ctx.reply({
    embeds: [statusEmbed("✅ Leaver Channel Set", `Leave messages will be posted in ${channel}.`, 0x57f287)],
  });
}