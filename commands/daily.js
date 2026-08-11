const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const DBL = require("dblapi.js");
const { TOPGG_TOKEN } = require("../config.json");
const { isExpired, formatExpiry } = require("../utils/time");

const BOT_ID = "670234327749099521";
const VOTE_URL = `https://top.gg/bot/${BOT_ID}/vote`;
const COOLDOWN_MS = 12 * 60 * 60 * 1000;
const MAX_REWARD = 500;

let dbl = null;
function getDbl(client) {
  if (!dbl) dbl = new DBL(TOPGG_TOKEN, client);
  return dbl;
}

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Get some money by voting for the bot every 12 hours."),

  allowPrefix: true,

  async execute(ctx, client) {
    const db = client.db;

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    const voteButtonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Vote on top.gg").setStyle(ButtonStyle.Link).setURL(VOTE_URL).setEmoji("🗳️"),
    );

    let voted;
    try {
      voted = await getDbl(client).hasVoted(ctx.user.id);
    } catch (err) {
      console.error("top.gg vote check failed:", err);
      return ctx.reply("Couldn't reach the voting service right now - please try again in a bit.");
    }

    if (!voted) {
      const embed = new EmbedBuilder()
        .setTitle("🗳️ Vote To Claim")
        .setDescription("You haven't voted today - vote for the bot to claim your daily reward!")
        .setColor(0x5865f2)
        .setFooter({ text: "If it doesn't work right after voting, wait 5-10 minutes and try again." })
        .setTimestamp();
      return ctx.reply({ embeds: [embed], components: [voteButtonRow] });
    }

    const lastClaim = await db.get(`daily_${ctx.user.id}`);
    if (lastClaim) {
      const cooldownExpiry = lastClaim + COOLDOWN_MS;
      if (!isExpired(cooldownExpiry)) {
        const embed = new EmbedBuilder()
          .setTitle("⏳ Cooldown Active")
          .setDescription(`You've already claimed today's reward. You can claim again at ${formatExpiry(cooldownExpiry)}.`)
          .setColor(0xed4245)
          .setTimestamp();
        return ctx.reply({ embeds: [embed] });
      }
    }

    const reward = Math.round(Math.random() * MAX_REWARD);
    await db.add(`cash_${ctx.user.id}`, reward);
    await db.set(`daily_${ctx.user.id}`, Date.now());

    const newCash = await db.get(`cash_${ctx.user.id}`);

    const embed = new EmbedBuilder()
      .setTitle("🎁 Daily Reward Claimed")
      .setDescription(`You received **$${reward.toLocaleString()}** for voting! Come back in 12 hours for more.`)
      .addFields({ name: "Cash Balance", value: `$${(newCash ?? reward).toLocaleString()}`, inline: true })
      .setColor(0x57f287)
      .setTimestamp();

    return ctx.reply({ embeds: [embed], components: [voteButtonRow] });
  },
};