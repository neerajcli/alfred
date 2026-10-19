const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const DISABLED_GUILD_ID = "568902211980099605";

module.exports = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Add or remove a role from a user.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a role to a user")
        .addUserOption((opt) => opt.setName("user").setDescription("User").setRequired(true))
        .addRoleOption((opt) => opt.setName("role").setDescription("Role to add").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a role from a user")
        .addUserOption((opt) => opt.setName("user").setDescription("User").setRequired(true))
        .addRoleOption((opt) => opt.setName("role").setDescription("Role to remove").setRequired(true)),
    ),

  allowPrefix: true,

  async execute(ctx, client) {
    if (ctx.guild.id === DISABLED_GUILD_ID) {
      return ctx.reply("Mod commands are disabled.");
    }

    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply("You don't have the perms to use this.");
    }

    const sub = ctx.getSubcommand();
    if (!["add", "remove"].includes(sub)) {
      return ctx.reply("Usage: `role add <@user> <@role>` or `role remove <@user> <@role>`");
    }

    let member, role;
    if (ctx.source === "slash") {
      member =
        ctx.raw.options.getMember("user") ||
        (await ctx.guild.members.fetch(ctx.raw.options.getUser("user").id).catch(() => null));
      role = ctx.raw.options.getRole("role");
    } else {
      member = ctx.raw.mentions.members.first();
      role = ctx.raw.mentions.roles.first();
    }

    if (!member) return ctx.reply("Mention (or specify) the user.");
    if (!role) return ctx.reply("Mention (or specify) the role.");

    if (role.id === ctx.guild.id) {
      return ctx.reply("You can't assign the `@everyone` role.");
    }
    if (role.managed) {
      return ctx.reply("That role is managed by an integration and can't be assigned manually.");
    }

    const isOwner = ctx.guild.ownerId === ctx.user.id;
    if (!isOwner && role.position >= ctx.member.roles.highest.position) {
      return ctx.reply("You can't manage a role equal to or higher than your highest role.");
    }

    const botMember = ctx.guild.members.me;
    if (role.position >= botMember.roles.highest.position) {
      return ctx.reply("I can't manage that role - it's equal to or higher than my highest role.");
    }

    const hasRole = member.roles.cache.has(role.id);

    const buildEmbed = ({ emoji, title, color }) =>
      new EmbedBuilder()
        .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
        .setTitle(`${emoji} ${title}`)
        .setThumbnail(member.displayAvatarURL())
        .addFields(
          { name: "User", value: `${member}`, inline: true },
          { name: "Role", value: `${role}`, inline: true },
        )
        .setColor(color)
        .setFooter({ text: `Role ID: ${role.id}` })
        .setTimestamp();

    try {
      if (sub === "add") {
        if (hasRole) return ctx.reply(`${member} already has that role.`);
        await member.roles.add(role);
        return ctx.reply({
          embeds: [buildEmbed({ emoji: "✅", title: "Role Added", color: 0x57f287 })],
        });
      }

      if (!hasRole) return ctx.reply(`${member} doesn't have that role.`);
      await member.roles.remove(role);
      return ctx.reply({
        embeds: [buildEmbed({ emoji: "🗑️", title: "Role Removed", color: 0xed4245 })],
      });
    } catch (err) {
      return ctx.reply("Something went wrong while updating that role. It may be positioned above my role, or I'm missing permissions.");
    }
  },
};