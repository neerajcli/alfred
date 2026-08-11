const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const PRIVACY_LAST_UPDATED = "August 2026";
const TOS_LAST_UPDATED = "August 2026";

function buildPrivacyEmbed(client) {
  return new EmbedBuilder()
    .setTitle("📜 Privacy Policy")
    .setDescription(
      "Here's a plain-language summary of what we access, what we store, and why. " +
      "By using this bot, you agree to the terms below.",
    )
    .addFields(
      {
        name: "🔍 What We Access",
        value: [
          "- The servers (guilds) you join or leave",
          "- Message content, only at the moment a feature needs it - e.g. AFK mention detection, or text you submit to `/feedback`, `/report`, `/appeal`, or `/dm`",
          "- Word moderation itself runs through Discord's own AutoMod system once configured - the bot doesn't read or store the messages it blocks",
        ].join("\n"),
      },
      {
        name: "🗂️ What We Store (1/2)",
        value: [
          "- Your Discord user ID, and any server IDs the bot is used in",
          "- Economy balances (cash, bank, redeems), item ownership (Security, Alfred Coin, Big Money), and bank passwords set via `reset-pass`",
          "- Blacklist/whitelist status and reasons, and maintenance-mode details",
          "- Custom server prefixes, AFK status/reason, and your messaging/DM preferences set via `/settings` (prefix opt-out, DM-block)",
          "- Appeal submissions you voluntarily provide, including an optional email address",
          "- Bug/user/server report submissions made via `/report`, including the report text and the accept/reject outcome",
          "- Feedback submitted via `/feedback`",
        ].join("\n"),
      },
      {
        name: "🗂️ What We Store (2/2)",
        value: [
          "- Donation claim submissions: optional email, amount donated, transaction ID, requested benefits, the server it was filed from (used to grant server premium there), and your proof-of-transaction screenshot",
          "- Premium status/expiry (yours or servers you administer), and pending promo codes generated for premium until claimed",
          "- Word-moderation word lists configured by server admins (not the messages that trigger them)",
          "- Server configuration set by admins: mod-log, autorole, welcomer/leaver settings, and custom role-shop items/prices",
          "- Moderation warnings (`/warn`), pending votekick/ban-report records (voter or reporter IDs and reasons) until resolved, and support-ticket records from `/support`",
          "- Giveaway entries, fun commands interaction counters, and game records such as Rock-Paper-Scissors win/loss/tie counts",
        ].join("\n"),
      },
      {
        name: "🎯 Why We Need It",
        value:
          "Features like welcomer/leaver messages, autorole, word moderation, the economy system, premium, giveaways, AFK, tickets, warnings, votekicks, ban reports, donations, and appeals can't work without reading or storing the data above.",
      },
      {
        name: "🔐 Data Handling & Safety",
        value: [
          "- Message content is read only when a relevant command/feature is triggered, and isn't stored afterward beyond what's listed above",
          "- No developer has direct access to your message content",
          "- Donation proof-of-transaction screenshots are reviewed manually by the bot owner to verify and grant your claim",
          "- Command usage (command name, your tag, the server/channel, a truncated preview) is logged to a private staff channel for debugging and abuse monitoring",
          "- Messages sent via `/dm` disclose your user ID and tag to the recipient, and can be reported by them via `/report user`",
          "- Stored data is kept only as long as needed to provide the related feature",
        ].join("\n"),
      },
      {
        name: "🧒 Children's Privacy",
        value:
          "This bot isn't directed at children under 13, in line with Discord's own Terms of Service, and we don't knowingly collect data from users under 13.",
      },
      {
        name: "🛠️ Your Rights",
        value: [
          "- Request deletion of your stored data at any time with `/settings data-delete`",
          "- Opt out of prefix-command message scanning with `/settings opt-out-messages`",
          "- Block other members from DMing you through the bot with `/settings block-dms`",
          "- Leaving all mutual servers doesn't automatically erase your data - use `/settings data-delete` for that",
        ].join("\n"),
      },
    )
    .setColor(0x5865f2)
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: `Last updated: ${PRIVACY_LAST_UPDATED} • By using this bot, you agree to this policy` });
}

function buildTermsEmbed(client) {
  return new EmbedBuilder()
    .setTitle("📃 Terms of Service")
    .setDescription(
      "These terms cover your use of the bot and its features. By adding or using the bot, you agree to the terms below.",
    )
    .addFields(
      {
        name: "✅ Acceptance",
        value:
          "By inviting, using, or interacting with the bot in any server, you agree to these terms and to our " +
          "Privacy Policy (see `/agreements privacy-policy`). If you don't agree, please don't use the bot.",
      },
      {
        name: "🧩 The Service",
        value: [
          "The bot provides moderation (word moderation, warnings, votekicks, ban reports, kicks, timeouts, bans, blacklisting), an economy system with a shop and per-server custom role shop,",
          "native polls and games, fun interaction commands, AFK status, premium features, giveaways, welcomer/leaver messages, autorole, support tickets, bug/user/server reports, a bot-relayed DM feature, appeals, and donation-based premium claims.",
          "Features may be added, changed, or removed at any time without prior notice.",
        ].join(" "),
      },
      {
        name: "👤 Eligibility",
        value:
          "You must meet Discord's own minimum age requirement (13, or higher where required by local law) to use this bot, in line with Discord's Terms of Service.",
      },
      {
        name: "🚫 Acceptable Use",
        value: [
          "- Don't attempt to exploit, abuse, or circumvent the bot's systems (economy, premium, moderation, or otherwise)",
          "- Don't use the bot to violate Discord's Terms of Service or Community Guidelines",
          "- Don't use `/dm` to harass, spam, or contact members who've blocked bot-relayed DMs - this may result in a blacklist",
          "- Don't submit false, misleading, or abusive reports, feedbacks, support tickets, or donation claims - this may result in a blacklist for the submitter",
          "- Respect blacklist and maintenance-mode restrictions - attempting to bypass them may extend a blacklist or result in a permanent one",
        ].join("\n"),
      },
      {
        name: "💳 Donations & Premium",
        value: [
          "- Donations are voluntary and processed externally via Razorpay or Patreon - the bot itself never handles your payment details",
          "- Premium benefits are granted manually by the bot owner after verifying your submitted proof of transaction, and aren't instant",
          "- Server Premium from a donation claim is granted to the server you ran the claim command in, not a server chosen afterward",
          "- Donations are non-refundable",
          "- Rejected claims will include a reason; you're welcome to resubmit with corrected information",
        ].join("\n"),
      },
      {
        name: "🔨 Blacklisting & Appeals",
        value:
          "The bot owner may blacklist a user or server, temporarily or permanently, for abuse or violations of these terms - including as the outcome of an accepted `/report`. " +
          "Blacklisted users/servers may appeal via `/appeal`, subject to a cooldown between attempts and a maximum of 3 total appeals.",
      },
      {
        name: "🐛 Bug Reports & Rewards",
        value:
          "Accepted bug reports submitted via `/report bug` may be rewarded with redeems at the bot owner's discretion. Reward amounts and eligibility may change at any time, and reports may be added to the public `/knownbugs` list.",
      },
      {
        name: "🤖 Word Moderation Disclaimer",
        value:
          "Word moderation is enforced through Discord's own AutoMod system. The bot is not responsible for messages it fails to block, or for messages incorrectly blocked, due to Discord platform limitations.",
      },
      {
        name: "⚠️ No Warranty",
        value:
          "The bot is provided \"as is\" with no guarantee of uptime, accuracy, or availability. Features, including premium ones, may be paused for maintenance without notice.",
      },
      {
        name: "🛡️ Limitation of Liability",
        value:
          "The bot owner isn't liable for any loss of data, economy balances, premium status, or other damages arising from use of, or inability to use, the bot.",
      },
      {
        name: "⛔ Termination",
        value:
          "The bot owner may deny, restrict, or terminate access to the bot for any user or server at any time, for any reason.",
      },
      {
        name: "✏️ Changes",
        value:
          "These terms may be updated at any time. Continued use of the bot after a change means you accept the updated terms.",
      },
    )
    .setColor(0x5865f2)
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: `Last updated: ${TOS_LAST_UPDATED} • By using this bot, you agree to these terms` });
}

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder()
    .setName("agreements")
    .setDescription("View our privacy policy or terms of service.")
    .addSubcommand((sub) => sub.setName("privacy-policy").setDescription("View our privacy policy"))
    .addSubcommand((sub) => sub.setName("terms-of-service").setDescription("View our terms of service")),

  allowPrefix: true,

  async execute(ctx, client) {
    const sub = ctx.getSubcommand();

    if (sub === "privacy-policy") {
      return ctx.reply({ embeds: [buildPrivacyEmbed(client)] });
    }

    if (sub === "terms-of-service") {
      return ctx.reply({ embeds: [buildTermsEmbed(client)] });
    }

    return ctx.reply("Usage: `/agreements privacy-policy` or `/agreements terms-of-service`");
  },
};