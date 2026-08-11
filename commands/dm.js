const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { requireUserPremium } = require("../utils/premium");
const { isExpired, formatExpiry } = require("../utils/time");

const COOLDOWN_MS = 5 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 1000;

module.exports = {
  category: "User Premium",
  data: new SlashCommandBuilder()
    .setName("dm")
    .setDescription("Send a DM to another member through the bot.")
    .addUserOption((opt) => opt.setName("user").setDescription("Who to DM").setRequired(true))
    .addStringOption((opt) => opt.setName("message").setDescription("The message to send").setRequired(true)),

  allowPrefix: true,
  optionOrder: ["user"],

  async execute(ctx, client) {
    if (!(await requireUserPremium(ctx, client))) return;

    const target = ctx.getUser("user");
    if (!target) return ctx.reply("User not found. Correct format is `dm @user <message>`.");
    if (target.id === ctx.user.id) return ctx.reply("You can't DM yourself!");
    if (target.bot) return ctx.reply("You can't DM a bot!");

    const blocked = (await client.db.get(`dmblock_${target.id}`)) === true;
    if (blocked) return ctx.reply("This user has opted out of receiving DMs through the bot.");

    const cooldownKey = `dmcooldown_${ctx.user.id}`;
    const lastSent = await client.db.get(cooldownKey);
    if (lastSent) {
      const cooldownExpiry = lastSent + COOLDOWN_MS;
      if (!isExpired(cooldownExpiry)) {
        return ctx.reply(`Please wait until ${formatExpiry(cooldownExpiry)} before sending another DM.`);
      }
    }

    const content = (ctx.source === "slash" ? ctx.getString("message") : ctx.restText)?.trim();
    if (!content) return ctx.reply("What do you want to DM them?");
    if (content.length > MAX_MESSAGE_LENGTH) {
      return ctx.reply(`Messages can't be longer than ${MAX_MESSAGE_LENGTH} characters.`);
    }

    const dmEmbed = new EmbedBuilder()
      .setAuthor({ name: `Message from ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
      .setDescription(content)
      .addFields({ name: "Sent via", value: `${ctx.guild.name} (relayed by ${client.user.username})` })
      .setFooter({ text: `Sender ID: ${ctx.user.id} - use /report user if this is unwanted or abusive` })
      .setColor(0x5865f2)
      .setTimestamp();

    try {
      await target.send({ embeds: [dmEmbed] });
    } catch {
      return ctx.reply("An error occurred - make sure the recipient has DMs open.");
    }

    await client.db.set(cooldownKey, Date.now());
    return ctx.reply("Done!");
  },
};