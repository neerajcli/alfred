const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isExpired, formatExpiry, resolveDurationSpec } = require("../utils/time");

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Claim a premium promocode.")
    .addSubcommand((sub) =>
      sub
        .setName("user")
        .setDescription("Claim a user premium promocode")
        .addStringOption((opt) => opt.setName("code").setDescription("The promocode").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("server")
        .setDescription("Claim a server premium promocode")
        .addStringOption((opt) => opt.setName("code").setDescription("The promocode").setRequired(true)),
    ),

  allowPrefix: true,

  async execute(ctx, client) {
    const db = client.db;
    const type = ctx.getSubcommand();

    if (!["user", "server"].includes(type)) {
      return ctx.reply("Usage: `claim user <code>` or `claim server <code>`");
    }

    const code = (ctx.source === "slash" ? ctx.getString("code") : ctx.restText)?.trim();
    if (!code) return ctx.reply(`Usage: \`claim ${type} <code>\``);

    const targetId = type === "user" ? ctx.user.id : ctx.guild.id;
    const premiumKey = `${type}premium_${targetId}`;
    const premiumTimeKey = `${type}premiumtime_${targetId}`;

    const alreadyPremium = (await db.get(premiumKey)) === true;
    if (alreadyPremium) {
      return ctx.reply(type === "user" ? "You are already a premium member." : "This server already has premium.");
    }

    const promoKey = `promo_${type}_${code}`;
    const promo = await db.get(promoKey);
    if (!promo) return ctx.reply("Invalid promocode.");

    const spec = promo.expirySpec;

    if (spec.type === "absolute" && isExpired(spec.timestamp)) {
      await db.delete(promoKey);
      return ctx.reply("This promocode has expired.");
    }

    const finalExpiry = resolveDurationSpec(spec);

    await db.delete(promoKey);
    await db.set(premiumKey, true);
    await db.set(premiumTimeKey, finalExpiry);

    const embed = new EmbedBuilder()
      .setTitle("✅ Promocode Claimed")
      .setDescription(
        type === "user" ? "You now have premium!" : `**${ctx.guild.name}** now has premium!`,
      )
      .addFields({ name: "Expires", value: formatExpiry(finalExpiry), inline: true })
      .setColor(0x57f287)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};