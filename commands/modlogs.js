const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

const DISABLED_GUILD_ID = "568902211980099605";

function resolveChannelArg(ctx) {
  if (ctx.source === "slash") return ctx.raw.options.getChannel("channel");
  return ctx.raw.mentions.channels.first() || null;
}

module.exports = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("modlogs")
    .setDescription("Manage this server's mod log settings.")
    .addSubcommand((sub) => sub.setName("enable").setDescription("Enable mod logs for this server"))
    .addSubcommand((sub) => sub.setName("disable").setDescription("Disable mod logs for this server"))
    .addSubcommand((sub) =>
      sub
        .setName("channel")
        .setDescription("Set the channel mod logs get posted to")
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("The channel to use").addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    ),

  allowPrefix: true,
  optionOrder: ["_subcommand"],

  async execute(ctx, client) {
    if (ctx.guild.id === DISABLED_GUILD_ID) {
      return ctx.reply("Mod commands are disabled in this server.");
    }
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return ctx.reply("You need the **Manage Channels** permission to do this.");
    }

    const sub = ctx.getSubcommand();
    if (sub === "enable") return handleEnable(ctx, client);
    if (sub === "disable") return handleDisable(ctx, client);
    if (sub === "channel") return handleChannel(ctx, client);
    return ctx.reply("Usage: `/modlogs <enable|disable|channel>`");
  },
};

async function handleEnable(ctx, client) {
  const db = client.db;

  const enabled = (await db.get(`mode_${ctx.guild.id}`)) === true;
  if (enabled) return ctx.reply("Mod logs are already enabled!");

  await db.set(`mode_${ctx.guild.id}`, true);

  const embed = new EmbedBuilder()
    .setTitle("📋 Mod Logs Enabled")
    .setDescription(
      `Mod logs have been enabled for this server.\nSet a logs channel with ${client.mentionCommand("modlogs channel")} to start receiving them.`,
    )
    .setColor(0x57f287)
    .setTimestamp();
  return ctx.reply({ embeds: [embed] });
}

async function handleDisable(ctx, client) {
  const db = client.db;

  const enabled = (await db.get(`mode_${ctx.guild.id}`)) === true;
  if (!enabled) return ctx.reply("Mod logs are not enabled!");

  await db.set(`mode_${ctx.guild.id}`, false);

  const embed = new EmbedBuilder()
    .setTitle("📋 Mod Logs Disabled")
    .setDescription("Mod logs have been disabled for this server.")
    .setColor(0xed4245)
    .setTimestamp();
  return ctx.reply({ embeds: [embed] });
}

async function handleChannel(ctx, client) {
  const db = client.db;

  const enabled = (await db.get(`mode_${ctx.guild.id}`)) === true;
  if (!enabled) {
    return ctx.reply(`Mod logs aren't enabled on this server yet - use ${client.mentionCommand("modlogs enable")} first.`);
  }

  const channel = resolveChannelArg(ctx);
  if (!channel || !channel.isTextBased?.()) {
    return ctx.reply("Please specify a valid text channel.");
  }

  await db.set("modc_" + ctx.guild.id, channel.id);
  await db.set("modcd_" + ctx.guild.id, true);

  const embed = new EmbedBuilder()
    .setTitle("📋 Logs Channel Set")
    .setDescription(`Mod logs channel has been set to ${channel}!`)
    .setColor(0x57f287)
    .setTimestamp();
  return ctx.reply({ embeds: [embed] });
}