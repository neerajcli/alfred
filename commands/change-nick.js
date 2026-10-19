const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const DISABLED_GUILD_ID = "568902211980099605";
const MAX_NICKNAME_LENGTH = 32;

async function resolveTarget(ctx, client) {
  let user = ctx.getUser("user");
  if (user) return user;
  if (ctx.source !== "message") return null;

  const rawToken = ctx.fullText?.split(/ +/)[0];
  const id = rawToken?.replace(/[<@!>]/g, "");
  if (!id) return null;

  return client.users.fetch(id).catch(() => null);
}

module.exports = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("change-nick")
    .setDescription("Change a user's nickname.")
    .addUserOption((opt) => opt.setName("user").setDescription("Whose nickname to change").setRequired(true))
    .addStringOption((opt) => opt.setName("nickname").setDescription("The new nickname").setRequired(true)),

  allowPrefix: true,
  optionOrder: ["user"],

  async execute(ctx, client) {
    if (ctx.guild.id === DISABLED_GUILD_ID) return ctx.reply("Mod commands are disabled in this server.");
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return ctx.reply("You need the **Manage Nicknames** permission to do this.");
    }

    const target = await resolveTarget(ctx, client);
    if (!target) return ctx.reply("Please mention someone.");

    const nickname = (
      ctx.source === "slash" ? ctx.getString("nickname") : ctx.restText
    )?.trim();
    if (!nickname) return ctx.reply("Please provide a nickname.");
    if (nickname.length > MAX_NICKNAME_LENGTH) {
      return ctx.reply(`Nicknames can't be longer than ${MAX_NICKNAME_LENGTH} characters.`);
    }

    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    if (!member) return ctx.reply("That user isn't a member of this server.");
    if (!member.manageable) {
      return ctx.reply("I can't change this user's nickname - check my role position (or they may be the server owner).");
    }

    const oldNickname = member.displayName;

    try {
      await member.setNickname(nickname, `Changed by ${ctx.user.tag}`);
    } catch (err) {
      console.error("Failed to set nickname:", err);
      return ctx.reply("Failed to change that nickname - make sure I have sufficient permissions.");
    }

    const embed = new EmbedBuilder()
      .setTitle("✏️ Nickname Changed")
      .setDescription(`**${target.tag}**'s nickname was updated.`)
      .addFields(
        { name: "Before", value: oldNickname, inline: true },
        { name: "After", value: nickname, inline: true },
        { name: "Moderator", value: `${ctx.user}`, inline: true },
      )
      .setColor(0x57f287)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};