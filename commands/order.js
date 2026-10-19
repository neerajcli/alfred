const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require("discord.js");
const crypto = require("crypto");
const ITEMS = require("../data/shop-items");
const { requireUserPremium } = require("../utils/premium");
const { parseDurationSpec, describeDurationSpec } = require("../utils/time");

const ORDERS_CHANNEL_ID = "966681651927220254";
const PROMO_DURATION = "30d";

const ORDERABLE_ITEMS = ITEMS.filter((i) => i.orderable);

function findOrderableItem(query) {
  if (!query) return null;
  const trimmed = query.trim().toLowerCase();
  const slug = trimmed.replace(/[\s_]+/g, "-");
  return ORDERABLE_ITEMS.find((i) => i.id === slug || i.name.toLowerCase() === trimmed) || null;
}

function randomCode(length, chars) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}
const makeOrderCode = () => randomCode(7, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
const makePromoCode = () => randomCode(10, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");

async function fetchOrdersChannel(client) {
  return (
    client.channels.cache.get(ORDERS_CHANNEL_ID) || (await client.channels.fetch(ORDERS_CHANNEL_ID).catch(() => null))
  );
}

const orderKey = (userId) => `order_${userId}`;
const activeOrderKey = (userId) => `activeorder_${userId}`;

function disabledRow(label, style, emoji) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("order:done")
      .setLabel(label)
      .setEmoji(emoji)
      .setStyle(style)
      .setDisabled(true),
  );
}

function orderEmbed(order, customerTag, { status = "pending", note = null } = {}) {
  const statusMeta = {
    pending: { title: "🧾 New Order", color: 0xfee75c },
    approved: { title: "✅ Order Approved", color: 0x57f287 },
    rejected: { title: "❌ Order Rejected", color: 0xed4245 },
  }[status];

  const embed = new EmbedBuilder()
    .setTitle(statusMeta.title)
    .addFields(
      { name: "Customer", value: `${customerTag} (${order.customerId})`, inline: true },
      { name: "Order ID", value: `\`${order.code}\``, inline: true },
      { name: "Item", value: `${order.itemEmoji} ${order.itemName}`, inline: true },
      { name: "Offered Price", value: `$${order.price.toLocaleString()}`, inline: true },
    )
    .setColor(statusMeta.color)
    .setTimestamp();

  if (note) embed.addFields({ name: status === "approved" ? "Note" : "Reason", value: note });

  return embed;
}

module.exports = {
  category: "User Premium",
  data: new SlashCommandBuilder()
    .setName("order")
    .setDescription("Order a shop item at your own price, subject to approval.")
    .addStringOption((opt) =>
      opt.setName("item").setDescription("Which item").setRequired(true).setAutocomplete(true),
    )
    .addIntegerOption((opt) =>
      opt.setName("price").setDescription("Your offered price").setRequired(true).setMinValue(1),
    ),

  allowPrefix: true,

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const matches = ORDERABLE_ITEMS.filter(
      (i) => i.name.toLowerCase().includes(focused) || i.id.includes(focused),
    ).slice(0, 25);
    await interaction.respond(matches.map((i) => ({ name: `${i.emoji} ${i.name}`, value: i.id })));
  },

  async execute(ctx, client) {
    const db = client.db;

    if (!(await requireUserPremium(ctx, client))) return;

    const authorPass = await db.get(`econpass_${ctx.user.id}`);
    if (authorPass == null) {
      return ctx.reply(
        `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
      );
    }

    let itemQuery, priceInput;
    if (ctx.source === "slash") {
      itemQuery = ctx.getString("item");
      priceInput = ctx.raw.options.getInteger("price");
    } else {
      const tokens = (ctx.fullText || "").split(/ +/).filter(Boolean);
      priceInput = parseInt(tokens[0], 10);
      itemQuery = tokens.slice(1).join(" ");
    }

    if (!Number.isInteger(priceInput) || priceInput < 1) {
      return ctx.reply("Please provide a valid price of at least $1. Correct format: `order <price> <item name>`");
    }

    const item = findOrderableItem(itemQuery);
    if (!item) {
      return ctx.reply(`Invalid item. You can order: ${ORDERABLE_ITEMS.map((i) => `**${i.name}**`).join(", ")}.`);
    }

    if ((await db.get(activeOrderKey(ctx.user.id))) === true) {
      return ctx.reply(
        "You already have an active order - please wait for it to be approved or rejected before placing another.",
      );
    }

    const cash = (await db.get(`cash_${ctx.user.id}`)) ?? 0;
    if (priceInput > cash) {
      return ctx.reply("Your offered price can't be greater than your current cash.");
    }

    const channel = await fetchOrdersChannel(client);
    if (!channel) return ctx.reply("A critical error occurred. Please contact developers.");

    const code = makeOrderCode();
    const order = {
      customerId: ctx.user.id,
      itemId: item.id,
      itemName: item.name,
      itemEmoji: item.emoji,
      price: priceInput,
      code,
      placedAt: Date.now(),
    };

    await db.set(orderKey(ctx.user.id), order);
    await db.set(activeOrderKey(ctx.user.id), true);
    await db.sub(`cash_${ctx.user.id}`, priceInput);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`order:approve:${ctx.user.id}`)
        .setLabel("Approve")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`order:reject:${ctx.user.id}`)
        .setLabel("Reject")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Danger),
    );

    const ownerMentions = client.owners.map((id) => `<@${id}>`).join(" ");
    await channel.send({ content: ownerMentions, embeds: [orderEmbed(order, ctx.user.tag)], components: [row] });

    return ctx.reply(
      `Your order has been placed - order ID \`${code}\`, keep it for future reference. Your cash has been reserved and will be refunded if the order is rejected. Make sure your DMs are open, since you'll be notified within 7 days - if you don't hear back by then, please use ${client.mentionCommand("support")}.`,
    );
  },

  async handleButton(interaction, client) {
    if (!client.owners.includes(interaction.user.id)) {
      return interaction.reply({ content: "Only bot devs can manage orders.", flags: MessageFlags.Ephemeral });
    }

    const [, action, customerId] = interaction.customId.split(":");
    if (action === "approve") return approveOrder(interaction, client, customerId);
    if (action === "reject") return openRejectModal(interaction, customerId);
  },

  async handleModal(interaction, client) {
    const [, kind, customerId, messageId] = interaction.customId.split(":");
    if (kind !== "rejectModal") return;
    return finalizeReject(interaction, client, customerId, messageId);
  },
};

async function approveOrder(interaction, client, customerId) {
  const db = client.db;
  const order = await db.get(orderKey(customerId));
  const active = await db.get(activeOrderKey(customerId));

  if (!order || active !== true) {
    return interaction.reply({ content: "This order is no longer active.", flags: MessageFlags.Ephemeral });
  }

  let dmNote;
  try {
    if (order.itemId === "redeem") {
      await db.add(`redeem_${customerId}`, 1);
      dmNote = "Your order for **Redeem** has been approved!";
    } else if (order.itemId === "alfred-coin") {
      await db.set(`coin_${customerId}`, true);
      dmNote = "Your order for **Alfred Coin** has been approved!";
    } else if (order.itemId === "big-money") {
      await db.set(`big_${customerId}`, true);
      dmNote = "Your order for **Big Money** has been approved!";
    } else if (order.itemId === "user-premium-voucher" || order.itemId === "server-premium-voucher") {
      const scope = order.itemId === "user-premium-voucher" ? "user" : "server";
      const spec = parseDurationSpec(PROMO_DURATION);
      const code = makePromoCode();
      await db.set(`promo_${scope}_${code}`, { expirySpec: spec, createdAt: Date.now() });
      dmNote = `Your order for **${order.itemName}** has been approved! Your promo code is \`${code}\` (case-sensitive), which grants ${describeDurationSpec(spec)}.`;
    } else {
      return interaction.reply({ content: "Unknown order item - nothing was changed.", flags: MessageFlags.Ephemeral });
    }
  } catch (err) {
    console.error("Failed to grant order item:", err);
    return interaction.reply({
      content: "Failed to grant the item - nothing was changed. Please investigate.",
      flags: MessageFlags.Ephemeral,
    });
  }

  await db.delete(activeOrderKey(customerId));
  await db.delete(orderKey(customerId));

  const customer = await client.users.fetch(customerId).catch(() => null);
  let dmFailed = false;
  if (customer) {
    try {
      await customer.send(dmNote);
    } catch {
      dmFailed = true;
    }
  } else {
    dmFailed = true;
  }

  const embed = orderEmbed(order, customer?.tag ?? customerId, {
    status: "approved",
    note: dmFailed ? "Approved, but the customer couldn't be DMed." : "Customer notified via DM.",
  });

  await interaction.update({
    embeds: [embed],
    components: [disabledRow(`Approved by ${interaction.user.username}`, ButtonStyle.Success, "✅")],
  });
}

async function openRejectModal(interaction, customerId) {
  const messageId = interaction.message.id;

  const modal = new ModalBuilder()
    .setCustomId(`order:rejectModal:${customerId}:${messageId}`)
    .setTitle("Reject Order")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Rejection reason")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(300)
          .setPlaceholder("Why is this order being rejected? The customer will see this.")
          .setRequired(true),
      ),
    );

  return interaction.showModal(modal);
}

async function finalizeReject(interaction, client, customerId, messageId) {
  const db = client.db;
  const reason = interaction.fields.getTextInputValue("reason").trim();

  const order = await db.get(orderKey(customerId));
  const active = await db.get(activeOrderKey(customerId));
  if (!order || active !== true) {
    return interaction.reply({ content: "This order is no longer active.", flags: MessageFlags.Ephemeral });
  }

  await db.delete(activeOrderKey(customerId));
  await db.delete(orderKey(customerId));
  await db.add(`cash_${customerId}`, order.price);

  const customer = await client.users.fetch(customerId).catch(() => null);
  let dmFailed = false;
  if (customer) {
    try {
      await customer.send(
        `Your order for **${order.itemName}** has been rejected: ${reason}\nYour $${order.price.toLocaleString()} has been refunded.`,
      );
    } catch {
      dmFailed = true;
    }
  } else {
    dmFailed = true;
  }

  const embed = orderEmbed(order, customer?.tag ?? customerId, {
    status: "rejected",
    note: reason + (dmFailed ? "\n\n*(Customer couldn't be DMed.)*" : ""),
  });

  try {
    const original = await interaction.channel.messages.fetch(messageId);
    await original.edit({
      embeds: [embed],
      components: [disabledRow(`Rejected by ${interaction.user.username}`, ButtonStyle.Danger, "❌")],
    });
  } catch (err) {
    console.error("Failed to update order message after reject:", err);
  }

  return interaction.reply({
    content: `Order for ${customer?.tag ?? customerId} rejected and refunded.`,
    flags: MessageFlags.Ephemeral,
  });
}