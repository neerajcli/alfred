const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const crypto = require("crypto");
const ITEMS = require("../data/shop-items");
const { parseDurationSpec, resolveDurationSpec, formatExpiry, describeDurationSpec } = require("../utils/time");

const PROMO_LOG_CHANNEL_ID = "748878657723957319";
const PREMIUM_DURATION = "30d";

function findItem(query) {
  if (!query) return null;
  const trimmed = query.trim().toLowerCase();
  const slug = trimmed.replace(/[\s_]+/g, "-");
  return ITEMS.find((i) => i.id === slug || i.name.toLowerCase() === trimmed) || null;
}

function priceLine(item) {
  return `$${item.price.toLocaleString()}`;
}

async function fetchPromoLogChannel(client) {
  return (
    client.channels.cache.get(PROMO_LOG_CHANNEL_ID) ||
    (await client.channels.fetch(PROMO_LOG_CHANNEL_ID).catch(() => null))
  );
}

function generateCode(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function buildShopEmbed() {
  const embed = new EmbedBuilder()
    .setTitle("🛒 Alfred Shop")
    .setDescription(
      "Use `/shop info <item>` for details or `/shop buy <item>` to purchase.\n" +
      "(Prefix: `a!shop info <item>` / `a!shop buy <item>`)",
    )
    .setColor(0x5865f2)
    .setTimestamp();

  for (const item of ITEMS) {
    embed.addFields({ name: `${item.emoji} ${item.name}`, value: `**Price:** ${priceLine(item)}`, inline: true });
  }
  return embed;
}

function buildInfoEmbed(item) {
  return new EmbedBuilder()
    .setTitle(`${item.emoji} ${item.name}`)
    .setDescription(item.description)
    .addFields({ name: "Price", value: priceLine(item) })
    .setColor(0x5865f2)
    .setTimestamp();
}

function purchaseEmbed(item, description) {
  return new EmbedBuilder()
    .setTitle(`${item.emoji} ${item.name} Purchased`)
    .setDescription(description)
    .setColor(0x57f287)
    .setTimestamp();
}

module.exports = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Browse and buy items from the shop.")
    .addSubcommand((sub) => sub.setName("view").setDescription("View everything available in the shop"))
    .addSubcommand((sub) =>
      sub
        .setName("info")
        .setDescription("Get details about a shop item")
        .addStringOption((opt) =>
          opt.setName("item").setDescription("Which item").setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("buy")
        .setDescription("Buy an item from the shop")
        .addStringOption((opt) =>
          opt.setName("item").setDescription("Which item").setRequired(true).setAutocomplete(true),
        ),
    ),

  allowPrefix: true,

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const matches = ITEMS.filter((i) => i.name.toLowerCase().includes(focused) || i.id.includes(focused)).slice(0, 25);
    await interaction.respond(matches.map((i) => ({ name: `${i.emoji} ${i.name} — ${priceLine(i)}`, value: i.id })));
  },

  async execute(ctx, client) {
    const db = client.db;
    const sub = ctx.getSubcommand();

    if (!sub) {
      return ctx.reply("Usage: `shop view`, `shop info <item>`, or `shop buy <item>`");
    }

    const authorPass = await db.get("econpass_" + ctx.user.id);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    if (sub === "view") return ctx.reply({ embeds: [buildShopEmbed()] });

    const itemQuery = ctx.source === "slash" ? ctx.getString("item") : ctx.restText?.trim();
    const item = findItem(itemQuery);
    if (!item) {
      return ctx.reply(`Couldn't find an item called "${itemQuery || ""}". Use \`/shop view\` to see what's available.`);
    }

    if (sub === "info") return ctx.reply({ embeds: [buildInfoEmbed(item)] });
    if (sub === "buy") return handleBuy(ctx, client, item);

    return ctx.reply("Usage: `shop view`, `shop info <item>`, or `shop buy <item>`");
  },
};

async function handleBuy(ctx, client, item) {
  const db = client.db;
  const userId = ctx.user.id;

  const cash = (await db.get(`cash_${userId}`)) ?? 0;
  if (cash < item.price) {
    return ctx.reply(
      `You don't have enough cash for **${item.name}** - you need ${priceLine(item)}, you have $${cash.toLocaleString()}.`,
    );
  }

  switch (item.id) {
    case "security":
      return buySecurity(ctx, client, item);
    case "mysterious-box":
      return buyMysteriousBox(ctx, client, item);
    case "redeem":
      return buyRedeem(ctx, client, item);
    case "alfred-coin":
      return buyAlfredCoin(ctx, client, item);
    case "big-money":
      return buyBigMoney(ctx, client, item);
    case "user-premium-voucher":
      return buyPromoCode(ctx, client, item, "user");
    case "server-premium-voucher":
      return buyPromoCode(ctx, client, item, "server");
    default:
      return ctx.reply("This item can't be purchased right now.");
  }
}

async function chargeCash(client, userId, amount) {
  await client.db.sub(`cash_${userId}`, amount);
}

async function buySecurity(ctx, client, item) {
  const db = client.db;
  if ((await db.get(`security_${ctx.user.id}`)) === true) {
    return ctx.reply("You already have active Security!");
  }

  await chargeCash(client, ctx.user.id, item.price);
  await db.set(`security_${ctx.user.id}`, true);

  return ctx.reply({
    embeds: [purchaseEmbed(item, "Rob protection is now active - the next robbery attempt against you will fail.")],
  });
}

async function buyMysteriousBox(ctx, client, item) {
  const db = client.db;
  await chargeCash(client, ctx.user.id, item.price);

  const roll = Math.floor(Math.random() * 1001);
  if (roll <= 3) {
    await db.add(`redeem_${ctx.user.id}`, 1);
    return ctx.reply({ embeds: [purchaseEmbed(item, "You opened the box and got incredibly lucky - a **Redeem**! 🎉")] });
  }

  const winnings = 2500 + Math.floor(Math.random() * 5501);
  await db.add(`cash_${ctx.user.id}`, winnings);
  return ctx.reply({ embeds: [purchaseEmbed(item, `You opened the box and found **$${winnings.toLocaleString()}**!`)] });
}

async function buyRedeem(ctx, client, item) {
  const db = client.db;
  await chargeCash(client, ctx.user.id, item.price);
  await db.add(`redeem_${ctx.user.id}`, 1);
  return ctx.reply({ embeds: [purchaseEmbed(item, "You received a **Redeem**!")] });
}

async function buyAlfredCoin(ctx, client, item) {
  const db = client.db;
  if ((await db.get(`coin_${ctx.user.id}`)) === true) {
    return ctx.reply("You already have an Alfred Coin!");
  }

  await chargeCash(client, ctx.user.id, item.price);
  await db.set(`coin_${ctx.user.id}`, true);
  return ctx.reply({ embeds: [purchaseEmbed(item, "Show it off in your balance!")] });
}

async function buyBigMoney(ctx, client, item) {
  const db = client.db;
  if ((await db.get(`big_${ctx.user.id}`)) === true) {
    return ctx.reply("You already own Big Money!");
  }

  await chargeCash(client, ctx.user.id, item.price);
  await db.set(`big_${ctx.user.id}`, true);
  return ctx.reply({
    embeds: [purchaseEmbed(item, `Claim $1,000 every hour with ${client.mentionCommand("bigmoney-claim")}!`)],
  });
}

async function buyPromoCode(ctx, client, item, scope) {
  const db = client.db;
  const spec = parseDurationSpec(PREMIUM_DURATION);
  const code = generateCode();

  const user = await client.users.fetch(ctx.user.id).catch(() => null);
  let delivered = false;
  if (user) {
    try {
      await user.send(
        `Your ${scope === "user" ? "User" : "Server"} Premium promo code is \`${code}\`. It's case-sensitive and grants ${describeDurationSpec(spec)}.`,
      );
      delivered = true;
    } catch {
      delivered = false;
    }
  }

  if (!delivered) {
    return ctx.reply("I couldn't DM you the promo code - please open your DMs and try again. You haven't been charged.");
  }

  await chargeCash(client, ctx.user.id, item.price);
  await db.set(`promo_${scope}_${code}`, { expirySpec: spec, createdAt: Date.now() });

  const logChannel = await fetchPromoLogChannel(client);
  if (logChannel) {
    await logChannel
      .send(
        `${ctx.user.tag} (${ctx.user.id}) generated a ${scope === "user" ? "User" : "Server"} promo code \`${code}\` in ${ctx.guild.name} (${ctx.guild.id}).`,
      )
      .catch((err) => console.error("Failed to post promo log:", err));
  }

  return ctx.reply({ embeds: [purchaseEmbed(item, "Check your DMs for the promo code!")] });
}