const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { requireGuildPremium } = require("../utils/premium");

module.exports = {
  category: "Server Premium",
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Create or close a support ticket.")
    .addSubcommand((sub) => sub.setName("create").setDescription("Open a new support ticket"))
    .addSubcommand((sub) => sub.setName("close").setDescription("Close this ticket channel")),

  allowPrefix: true,
  optionOrder: ["_subcommand"],

  async execute(ctx, client) {
    if (!(await requireGuildPremium(ctx, client))) return;

    const sub = ctx.getSubcommand();
    if (sub === "create") return handleCreate(ctx, client);
    if (sub === "close") return handleClose(ctx, client);
    return ctx.reply("Usage: `/ticket <create|close>`");
  },
};

async function handleCreate(ctx, client) {
  const db = client.db;

  const moderatorRole = ctx.guild.roles.cache.find((r) => r.name.toLowerCase() === "moderator");
  if (!moderatorRole) {
    return ctx.reply("Your server needs a role named **Moderator** to use tickets.");
  }

  if (!ctx.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return ctx.reply("I need the **Manage Channels** permission to create tickets.");
  }

  const pendingKey = `ticketpending_${ctx.user.id}${ctx.guild.id}`;
  const channelIdKey = `ticketchannelid_${ctx.user.id}${ctx.guild.id}`;

  const pending = await db.get(pendingKey);
  if (pending === true) {
    const pendingId = await db.get(channelIdKey);
    const stillExists = pendingId && ctx.guild.channels.cache.has(pendingId);
    if (stillExists) {
      return ctx.reply(`You already have an open ticket: <#${pendingId}>. Please use that channel for your query.`);
    }
    await db.delete(pendingKey);
    await db.delete(channelIdKey);
  }

  await db.add(`ticketnumber_${ctx.guild.id}`, 1);
  const ticketNumber = await db.get(`ticketnumber_${ctx.guild.id}`);

  const everyoneId = ctx.guild.roles.everyone.id;
  const fullAccess = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory];

  let channel;
  try {
    channel = await ctx.guild.channels.create({
      name: `ticket-${ticketNumber}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: everyoneId, deny: fullAccess },
        { id: ctx.user.id, allow: fullAccess },
        { id: moderatorRole.id, allow: fullAccess },
      ],
    });
  } catch (err) {
    console.error("Failed to create ticket channel:", err);
    return ctx.reply("Failed to create your ticket channel - please contact a server admin.");
  }

  await db.set(pendingKey, true);
  await db.set(channelIdKey, channel.id);
  await db.set(`ticketchannel_${channel.id}`, true);
  await db.set(`ticketuserid_${channel.id}`, ctx.user.id);

  const welcomeEmbed = new EmbedBuilder()
    .setTitle("🎫 Ticket Opened")
    .setDescription(
      `Hello ${ctx.user}!\n\nThanks for creating a ticket. Please describe your issue here - our moderator team will be with you shortly.`,
    )
    .setColor(0x5865f2)
    .setTimestamp();
  await channel.send({ content: `${ctx.user} | ${moderatorRole}`, embeds: [welcomeEmbed] });

  const confirmEmbed = new EmbedBuilder()
    .setTitle("🎫 Ticket Created")
    .setDescription(`Your ticket has been created: ${channel}`)
    .setColor(0x57f287)
    .setTimestamp();
  return ctx.reply({ embeds: [confirmEmbed] });
}

async function handleClose(ctx, client) {
  const db = client.db;

  const canClose =
    ctx.member.permissions.has(PermissionFlagsBits.ManageChannels) ||
    ctx.member.permissions.has(PermissionFlagsBits.Administrator);
  if (!canClose) return ctx.reply("You need the **Manage Channels** permission to do this.");

  const isTicketChannel = (await db.get(`ticketchannel_${ctx.channel.id}`)) === true;
  if (!isTicketChannel) return ctx.reply("This channel is not a ticket channel.");

  const ticketOwnerId = await db.get(`ticketuserid_${ctx.channel.id}`);

  const embed = new EmbedBuilder()
    .setTitle("🔒 Closing Ticket")
    .setDescription(`This ticket is being closed by ${ctx.user}. This channel will be deleted in 5 seconds.`)
    .setColor(0xed4245)
    .setTimestamp();
  await ctx.reply({ embeds: [embed] });

  await db.delete(`ticketchannel_${ctx.channel.id}`);
  await db.delete(`ticketuserid_${ctx.channel.id}`);
  if (ticketOwnerId) {
    await db.delete(`ticketpending_${ticketOwnerId}${ctx.guild.id}`);
    await db.delete(`ticketchannelid_${ticketOwnerId}${ctx.guild.id}`);
  }

  setTimeout(() => {
    ctx.channel.delete().catch((err) => console.error("Failed to delete ticket channel:", err));
  }, 5000);
}