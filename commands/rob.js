const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isExpired, formatExpiry } = require("../utils/time");
const ms = require("ms");

const COOLDOWN_MS = 3 * 60 * 60 * 1000;
const WIN_THRESHOLD = 3;
const BREACH_DELAY = "7s";
const FAIL_DELAY = "5s";

const EXTRA_PROTECTED_ID = "670234327749099521";

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Attempt to rob another user.")
    .addSubcommand((sub) =>
      sub
        .setName("cash")
        .setDescription("Try to pickpocket cash from another user's wallet (chance-based)")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to rob").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("bank")
        .setDescription("Breach another user's bank if you know their password")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to hack").setRequired(true))
        .addStringOption((opt) => opt.setName("password").setDescription("Their bank password").setRequired(true)),
    ),

  allowPrefix: true,
  optionOrder: ["_subcommand", "user"],

  async execute(ctx, client) {
    const db = client.db;

    const sub = ctx.getSubcommand();
    if (sub !== "cash" && sub !== "bank") {
      return ctx.reply("Usage: `rob cash <user>` or `rob bank <user> <password>`");
    }

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    const victim = ctx.getUser("user");
    if (!victim) return ctx.reply("Please mention someone to rob.");
    if (victim.id === ctx.user.id) return ctx.reply("You can't rob yourself!");

    const protectedIds = new Set([...client.owners, EXTRA_PROTECTED_ID]);
    if (protectedIds.has(victim.id)) return ctx.reply("You can't rob this user!");
    if (victim.bot) return ctx.reply("You can't rob a bot!");

    let password = null;
    if (sub === "bank") {
      password = (
        ctx.source === "slash" ? ctx.getString("password") : ctx.restText.split(/ +/).slice(1).join(" ")
      )?.trim();
      if (!password) {
        return ctx.reply("Please provide the target's password. Usage: `rob bank @user <password>`");
      }
    }

    const cooldownKey = `rob_${sub}_${ctx.user.id}`;
    const lastAttempt = await db.get(cooldownKey);
    if (lastAttempt) {
      const cooldownExpiry = lastAttempt + COOLDOWN_MS;
      if (!isExpired(cooldownExpiry)) {
        const embed = new EmbedBuilder()
          .setTitle("⏳ Cooldown Active")
          .setDescription(
            `You need to wait until ${formatExpiry(cooldownExpiry)} to try ${sub === "cash" ? "robbing someone's cash" : "hacking someone's bank"} again.`,
          )
          .setColor(0xed4245)
          .setTimestamp();
        return ctx.reply({ embeds: [embed] });
      }
    }

    await db.set(cooldownKey, Date.now());

    if (sub === "cash") return handleCash(ctx, client, victim);
    return handleBank(ctx, client, victim, password);
  },
};

async function handleCash(ctx, client, victim) {
  const db = client.db;

  const hasSecurity = (await db.get(`security_${victim.id}`)) === true;
  if (hasSecurity) {
    await db.delete(`security_${victim.id}`);
    const embed = new EmbedBuilder()
      .setTitle("🛡️ Robbery Foiled")
      .setDescription(
        `You tried to rob **${victim.username}**, but their active security stopped you. Their security has been used up.`,
      )
      .setColor(0xfee75c)
      .setTimestamp();
    return ctx.reply({ embeds: [embed] });
  }

  const victimBalKey = "cash_" + victim.id;
  const victimBal = await db.get(victimBalKey);
  if (!victimBal || victimBal <= 0) {
    const embed = new EmbedBuilder()
      .setTitle("Rob")
      .setDescription(`**${victim.username}** doesn't have any cash for you to take.`)
      .setColor(0x99aab5)
      .setTimestamp();
    return ctx.reply({ embeds: [embed] });
  }

  const roll = Math.round(Math.random() * 10);
  const succeeded = roll <= WIN_THRESHOLD;

  if (succeeded) {
    const stolen = Math.round(Math.random() * victimBal);
    await db.add("cash_" + ctx.user.id, stolen);
    await db.sub(victimBalKey, stolen);

    const embed = new EmbedBuilder()
      .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
      .setTitle("💰 Rob Successful")
      .setDescription(`You robbed **$${stolen.toLocaleString()}** from **${victim.username}**'s wallet!`)
      .setThumbnail(victim.displayAvatarURL())
      .setColor(0x57f287)
      .setTimestamp();
    return ctx.reply({ embeds: [embed] });
  }

  let robberCash = await db.get("cash_" + ctx.user.id);
  if (robberCash === null) {
    robberCash = 0;
    await db.set("cash_" + ctx.user.id, 0);
  }
  const robberBank = (await db.get("bank_" + ctx.user.id)) ?? 0;

  const netWorth = robberCash + robberBank;
  const fine = Math.round(Math.random() * 0.4 * netWorth);

  if (fine > 0) await db.sub("cash_" + ctx.user.id, fine);

  const embed = new EmbedBuilder()
    .setAuthor({ name: ctx.user.tag, iconURL: ctx.user.displayAvatarURL() })
    .setTitle("🚔 Caught!")
    .setDescription(`You were caught trying to rob **${victim.username}** and were fined **$${fine.toLocaleString()}**.`)
    .setColor(0xed4245)
    .setTimestamp();
  return ctx.reply({ embeds: [embed] });
}

async function handleBank(ctx, client, victim, password) {
  const db = client.db;

  const victimPass = await db.get("econpass_" + victim.id);

  const processingEmbed = new EmbedBuilder()
    .setTitle("🔓 Breach In Progress")
    .setDescription(`Attempting to breach into <@${victim.id}>'s account. Please wait...`)
    .setColor(0x2c2f33)
    .setTimestamp();

  let sentMessage = null;
  if (ctx.source === "slash") {
    await ctx.raw.reply({ embeds: [processingEmbed] });
  } else {
    sentMessage = await ctx.channel.send({ embeds: [processingEmbed] });
  }
  const updateReply = async (embed) => {
    if (ctx.source === "slash") {
      await ctx.raw.editReply({ embeds: [embed] });
    } else {
      await sentMessage.edit({ embeds: [embed] });
    }
  };

  if (victimPass != null && password === victimPass) {
    let bankBal = await db.get(`bank_${victim.id}`);
    if (bankBal === null || bankBal < 0) bankBal = 0;

    await db.add("bank_" + ctx.user.id, bankBal);
    await db.set("bank_" + victim.id, 0);

    await new Promise((resolve) => setTimeout(resolve, ms(BREACH_DELAY)));

    const successEmbed = new EmbedBuilder()
      .setTitle("✅ Authentication Successful")
      .setDescription(
        `Successfully breached into <@${victim.id}>'s account and stole **$${bankBal.toLocaleString()}** from their bank.`,
      )
      .setColor(0x2ecc71)
      .setTimestamp();
    await updateReply(successEmbed);

    try {
      await victim.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🚨 Bank Alert")
            .setDescription(
              `Your account has been breached. Please reset your password using ${client.mentionCommand("reset-pass")} in any server.`,
            )
            .setColor(0xed4245)
            .setTimestamp(),
        ],
      });
    } catch {
    }
  } else {
    await new Promise((resolve) => setTimeout(resolve, ms(FAIL_DELAY)));

    const failEmbed = new EmbedBuilder()
      .setTitle("❌ Authentication Error")
      .setDescription(`Failed to breach into <@${victim.id}>'s account.`)
      .addFields({ name: "Reason", value: "Incorrect Password" })
      .setColor(0xed4245)
      .setTimestamp();
    await updateReply(failEmbed);
  }
}