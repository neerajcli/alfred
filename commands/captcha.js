const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require("discord.js");
const { CaptchaGenerator } = require("captcha-canvas");
const { requireGuildPremium } = require("../utils/premium");

const CODE_TTL_MS = 10 * 60 * 1000;

const enabledKey = (guildId) => `captcha_enabled_${guildId}`;
const roleKey = (guildId) => `captcha_role_${guildId}`;
const verifiedKey = (guildId, userId) => `captcha_verified_${guildId}_${userId}`;
const pendingKey = (guildId, userId) => `captcha_pending_${guildId}_${userId}`;

function statusEmbed(title, description, color) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

async function generateCaptchaImage() {
  const captcha = new CaptchaGenerator()
    .setDimension(150, 450)
    .setCaptcha({ size: 60, color: "#5865f2", characters: 6 })
    .setDecoy({ opacity: 0.5 })
    .setTrace({ color: "#5865f2" });
  const buffer = await captcha.generate();
  return { buffer, code: captcha.text };
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
  category: "Server Premium",
  data: new SlashCommandBuilder()
    .setName("captcha")
    .setDescription("Captcha verification system.")
    .addSubcommand((sub) => sub.setName("on").setDescription("Enable captcha verification for this server."))
    .addSubcommand((sub) => sub.setName("off").setDescription("Disable captcha verification for this server."))
    .addSubcommand((sub) =>
      sub
        .setName("role")
        .setDescription("Set the role given after verifying.")
        .addRoleOption((opt) => opt.setName("role").setDescription("Role to grant on verification").setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName("generate").setDescription("Generate a new captcha to verify yourself."))
    .addSubcommand((sub) =>
      sub
        .setName("verify")
        .setDescription("Verify using your captcha code.")
        .addStringOption((opt) =>
          opt.setName("code").setDescription("The code from your captcha image").setRequired(true),
        ),
    ),

  allowPrefix: true,

  async execute(ctx, client) {
    if (!ctx.guild) return ctx.reply("This command can only be used inside a server.");

    if (!(await requireGuildPremium(ctx, client))) return;

    const sub = ctx.getSubcommand();
    if (sub === "on") return handleOn(ctx, client);
    if (sub === "off") return handleOff(ctx, client);
    if (sub === "role") return handleSetRole(ctx, client);
    if (sub === "generate") return handleGenerate(ctx, client);
    if (sub === "verify") return handleVerify(ctx, client);

    return ctx.reply("Usage: `/captcha <on|off|role|generate|verify>`");
  },
};

async function handleOn(ctx, client) {
  if (!(await requireManageChannels(ctx))) return;
  const db = client.db;

  const alreadyOn = await db.get(enabledKey(ctx.guild.id));
  if (alreadyOn === true) {
    return ctx.reply({ embeds: [statusEmbed("🔐 Captcha System", "Captcha verification is already enabled here.", 0xfee75c)] });
  }

  await db.set(enabledKey(ctx.guild.id), true);

  return ctx.reply({
    embeds: [
      statusEmbed(
        "🔐 Captcha System Enabled",
        "Members will need to verify to get their role. Next, set a role to grant on success:\n" +
        "`/captcha role role:<@role>` or `a!captcha role <@role>`",
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
    return ctx.reply({ embeds: [statusEmbed("🔐 Captcha System", "Captcha verification isn't enabled here.", 0xfee75c)] });
  }

  await db.set(enabledKey(ctx.guild.id), false);
  return ctx.reply({
    embeds: [statusEmbed("🔓 Captcha System Disabled", "Captcha verification has been turned off for this server.", 0x57f287)],
  });
}

async function handleSetRole(ctx, client) {
  if (!(await requireManageChannels(ctx))) return;
  const db = client.db;

  const isOn = await db.get(enabledKey(ctx.guild.id));
  if (isOn !== true) {
    return ctx.reply({ embeds: [statusEmbed("🔐 Captcha System", "Enable the captcha system first with `/captcha on`.", 0xed4245)] });
  }

  let role;
  if (ctx.source === "slash") {
    role = ctx.raw.options.getRole("role");
  } else {
    const roleId = ctx.restText?.trim().replace(/[<@&>]/g, "");
    role = roleId ? ctx.guild.roles.cache.get(roleId) : null;
  }

  if (!role) return ctx.reply("Please mention a valid role!");

  await db.set(roleKey(ctx.guild.id), role.id);

  return ctx.reply({
    embeds: [statusEmbed("✅ Captcha Role Set", `Members will receive ${role} after verifying.`, 0x57f287)],
  });
}

async function checkCaptchaPreconditions(ctx, client) {
  const db = client.db;
  const guildId = ctx.guild.id;
  const userId = ctx.user.id;

  const isOn = await db.get(enabledKey(guildId));
  if (isOn !== true) {
    await ctx.reply({ embeds: [statusEmbed("🔐 Captcha System", "Captcha verification isn't enabled here.", 0xed4245)] });
    return null;
  }

  const roleId = await db.get(roleKey(guildId));
  if (!roleId) {
    await ctx.reply({
      embeds: [
        statusEmbed(
          "🔐 Captcha System",
          "No verification role has been set up yet - ask a server admin to run `/captcha role`.",
          0xed4245,
        ),
      ],
    });
    return null;
  }

  const alreadyVerified = await db.get(verifiedKey(guildId, userId));
  if (alreadyVerified === true) {
    await ctx.reply({ embeds: [statusEmbed("✅ Already Verified", "You've already verified in this server.", 0x57f287)] });
    return null;
  }

  return { roleId };
}

async function handleGenerate(ctx, client) {
  const db = client.db;
  const guildId = ctx.guild.id;
  const userId = ctx.user.id;

  const context = await checkCaptchaPreconditions(ctx, client);
  if (!context) return;

  const { buffer, code } = await generateCaptchaImage();
  await db.set(pendingKey(guildId, userId), { code, expires: Date.now() + CODE_TTL_MS });

  const attachment = new AttachmentBuilder(buffer, { name: "captcha.png" });
  const dmEmbed = new EmbedBuilder()
    .setTitle("🔐 Verify Your Account")
    .setDescription(
      [
        `Enter the code shown below in **${ctx.guild.name}** using:`,
        "`/captcha verify code:<code>` or `a!captcha verify <code>`",
        "",
        "Codes are **case-sensitive** and expire in **10 minutes**.",
      ].join("\n"),
    )
    .setImage("attachment://captcha.png")
    .setColor(0x5865f2)
    .setTimestamp();

  try {
    await ctx.user.send({ embeds: [dmEmbed], files: [attachment] });
  } catch {
    return ctx.reply({ embeds: [statusEmbed("⚠️ Couldn't DM You", "Please enable DMs from server members and try again.", 0xed4245)] });
  }

  return ctx.reply({ embeds: [statusEmbed("📬 Check Your DMs", "Your captcha has been sent - enter the code to verify.", 0x5865f2)] });
}

async function handleVerify(ctx, client) {
  const db = client.db;
  const guildId = ctx.guild.id;
  const userId = ctx.user.id;

  const context = await checkCaptchaPreconditions(ctx, client);
  if (!context) return;
  const { roleId } = context;

  const submitted = (ctx.source === "slash" ? ctx.getString("code") : ctx.restText)?.trim();
  if (!submitted) return ctx.reply("Please provide your captcha code.");

  const pending = await db.get(pendingKey(guildId, userId));
  if (!pending) {
    return ctx.reply({ embeds: [statusEmbed("🔐 No Active Captcha", "Generate a new one first with `/captcha generate`.", 0xed4245)] });
  }

  if (Date.now() > pending.expires) {
    await db.delete(pendingKey(guildId, userId));
    return ctx.reply({
      embeds: [statusEmbed("⏳ Code Expired", "That code has expired - generate a new one with `/captcha generate`.", 0xed4245)],
    });
  }

  if (submitted !== pending.code) {
    return ctx.reply({
      embeds: [statusEmbed("❌ Invalid Code", "That code doesn't match - double-check it (codes are case-sensitive).", 0xed4245)],
    });
  }

  const role = ctx.guild.roles.cache.get(roleId);
  if (!role) {
    return ctx.reply({
      embeds: [statusEmbed("⚠️ Role Missing", "The configured verification role no longer exists - ask an admin to set a new one.", 0xed4245)],
    });
  }

  try {
    await ctx.member.roles.add(role);
  } catch (err) {
    console.error("Failed to add captcha role:", err);
    return ctx.reply({
      embeds: [
        statusEmbed(
          "⚠️ Couldn't Assign Role",
          "I might be missing permissions, or my role is positioned below the verification role.",
          0xed4245,
        ),
      ],
    });
  }

  await db.delete(pendingKey(guildId, userId));
  await db.set(verifiedKey(guildId, userId), true);

  return ctx.reply({ embeds: [statusEmbed("✅ Verified!", `You've successfully verified and received ${role}.`, 0x57f287)] });
}