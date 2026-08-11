const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { requireGuildPremium } = require("../utils/premium");

function resolveRoleArg(ctx) {
  if (ctx.source === "slash") return ctx.raw.options.getRole("role");
  return ctx.raw.mentions.roles.first() || null;
}

module.exports = {
  category: "Server Premium",
  data: new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Manage this server's autorole feature.")
    .addSubcommand((sub) => sub.setName("enable").setDescription("Enable autorole for this server"))
    .addSubcommand((sub) => sub.setName("disable").setDescription("Disable autorole for this server"))
    .addSubcommand((sub) =>
      sub
        .setName("role")
        .setDescription("Set the role given to new members")
        .addRoleOption((opt) => opt.setName("role").setDescription("The role to assign").setRequired(true)),
    ),

  allowPrefix: true,
  optionOrder: ["_subcommand"],

  async execute(ctx, client) {
    if (!(await requireGuildPremium(ctx, client))) return;

    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply("You need the **Manage Roles** permission to do this.");
    }

    const sub = ctx.getSubcommand();
    if (sub === "enable") return handleEnable(ctx, client);
    if (sub === "disable") return handleDisable(ctx, client);
    if (sub === "role") return handleRole(ctx, client);
    return ctx.reply("Usage: `/autorole <enable|disable|role>`");
  },
};

async function handleEnable(ctx, client) {
  const db = client.db;

  const alreadyEnabled = (await db.get(`autorolestatus_${ctx.guild.id}`)) === true;
  if (alreadyEnabled) return ctx.reply("Autorole is already enabled!");

  await db.set(`autorolestatus_${ctx.guild.id}`, true);

  const embed = new EmbedBuilder()
    .setTitle("✅ Autorole Enabled")
    .setDescription(
      `Autorole has been enabled for this server.\nUse ${client.mentionCommand("autorole role")} to set which role gets assigned - autorole won't do anything until a role is set.`,
    )
    .setColor(0x57f287)
    .setTimestamp();
  return ctx.reply({ embeds: [embed] });
}

async function handleDisable(ctx, client) {
  const db = client.db;

  const currentlyEnabled = (await db.get(`autorolestatus_${ctx.guild.id}`)) === true;
  if (!currentlyEnabled) return ctx.reply("Autorole is already disabled!");

  await db.delete(`autorolestatus_${ctx.guild.id}`);
  await db.delete(`roleautorole_${ctx.guild.id}`);

  const embed = new EmbedBuilder()
    .setTitle("🚫 Autorole Disabled")
    .setDescription("Autorole has been disabled for this server.")
    .setColor(0xed4245)
    .setTimestamp();
  return ctx.reply({ embeds: [embed] });
}

async function handleRole(ctx, client) {
  const db = client.db;

  const isEnabled = (await db.get(`autorolestatus_${ctx.guild.id}`)) === true;
  if (!isEnabled) {
    return ctx.reply(`Autorole is disabled - enable it first with ${client.mentionCommand("autorole enable")}.`);
  }

  const role = resolveRoleArg(ctx);
  if (!role) return ctx.reply("Please mention a role.");

  if (role.id === ctx.guild.id) return ctx.reply("You can't use `@everyone` as the autorole.");
  if (role.managed) return ctx.reply("That role is managed by an integration/bot and can't be assigned manually.");

  const me = ctx.guild.members.me;
  if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return ctx.reply("I need the **Manage Roles** permission to assign this role automatically.");
  }
  if (role.position >= me.roles.highest.position) {
    return ctx.reply("That role is above (or equal to) my highest role, so I won't be able to assign it - move my role above it first.");
  }

  await db.set(`roleautorole_${ctx.guild.id}`, role.id);

  const embed = new EmbedBuilder()
    .setTitle("✅ Autorole Set")
    .setDescription(`New members will now automatically receive the ${role} role.`)
    .setColor(0x57f287)
    .setTimestamp();
  return ctx.reply({ embeds: [embed] });
}