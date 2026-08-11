const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { requireGuildPremium } = require("../utils/premium");

const MAX_SLOTS = 6;

function shopKey(guildId) {
    return `servershop_${guildId}`;
}

async function getShop(db, guildId) {
    return (await db.get(shopKey(guildId))) || {};
}

async function requirePremiumAndPass(ctx, client) {
    if (!(await requireGuildPremium(ctx, client))) return false;
    const authorPass = await client.db.get(`econpass_${ctx.user.id}`);
    if (authorPass == null) {
        await ctx.reply(
            `Please create your bank password using the ${client.mentionCommand("reset-pass")} command to use this command.`,
        );
        return false;
    }
    return true;
}

function buildShopEmbed(shop, guild) {
    const entries = Object.entries(shop).sort(([a], [b]) => Number(a) - Number(b));

    const embed = new EmbedBuilder()
        .setTitle(`🛍️ ${guild.name}'s Server Shop`)
        .setColor(0x5865f2)
        .setTimestamp();

    if (!entries.length) {
        embed.setDescription("No items are set yet - ask a server admin to add some with `/server-shop set`.");
        return embed;
    }

    embed.setDescription(
        "Use `/server-shop buy <slot>` to purchase - you'll receive the matching role!\n" +
        "(Prefix: `a!server-shop buy <slot>`)",
    );

    for (const [slot, data] of entries) {
        const role = guild.roles.cache.get(data.roleId);
        embed.addFields({
            name: `${slot}.) ${role ? role.name : "⚠️ Role no longer exists"}`,
            value: `**Price:** $${data.price.toLocaleString()}`,
            inline: true,
        });
    }

    return embed;
}

module.exports = {
    category: "Server Premium",
    data: new SlashCommandBuilder()
        .setName("server-shop")
        .setDescription("This server's custom role shop.")
        .addSubcommand((sub) => sub.setName("view").setDescription("View this server's shop"))
        .addSubcommand((sub) =>
            sub
                .setName("set")
                .setDescription("Set a shop slot (Manage Roles required)")
                .addIntegerOption((opt) =>
                    opt.setName("slot").setDescription("Slot number").setRequired(true).setMinValue(1).setMaxValue(MAX_SLOTS),
                )
                .addRoleOption((opt) => opt.setName("role").setDescription("Role to grant on purchase").setRequired(true))
                .addIntegerOption((opt) =>
                    opt.setName("price").setDescription("Price in cash").setRequired(true).setMinValue(1),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName("remove")
                .setDescription("Clear a shop slot (Manage Roles required)")
                .addIntegerOption((opt) =>
                    opt.setName("slot").setDescription("Slot number").setRequired(true).setMinValue(1).setMaxValue(MAX_SLOTS),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName("buy")
                .setDescription("Buy an item from this server's shop")
                .addIntegerOption((opt) =>
                    opt.setName("slot").setDescription("Slot number").setRequired(true).setMinValue(1).setMaxValue(MAX_SLOTS),
                ),
        ),

    allowPrefix: true,

    async execute(ctx, client) {
        if (!ctx.guild) return ctx.reply("This command can only be used in a server.");
        if (!(await requirePremiumAndPass(ctx, client))) return;
        const sub = ctx.getSubcommand();
        if (!["view", "set", "remove", "buy"].includes(sub)) {
            return ctx.reply("Usage: `server-shop view`, `server-shop set`, `server-shop remove`, or `server-shop buy`");
        }

        if (sub === "view") return handleView(ctx, client);
        if (sub === "set") return handleSet(ctx, client);
        if (sub === "remove") return handleRemove(ctx, client);
        return handleBuy(ctx, client);
    },
};

async function handleView(ctx, client) {
    const shop = await getShop(client.db, ctx.guild.id);
    return ctx.reply({ embeds: [buildShopEmbed(shop, ctx.guild)] });
}

async function handleSet(ctx, client) {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return ctx.reply("You need the **Manage Roles** permission to configure the server shop.");
    }

    let slot, role, priceInput;
    if (ctx.source === "slash") {
        slot = ctx.raw.options.getInteger("slot");
        role = ctx.raw.options.getRole("role");
        priceInput = ctx.raw.options.getInteger("price");
    } else {
        const tokens = (ctx.restText || "").split(/ +/).filter(Boolean);
        slot = parseInt(tokens[0], 10);
        role = ctx.raw.mentions.roles.first();
        priceInput = parseInt(tokens[tokens.length - 1], 10);
    }

    if (!Number.isInteger(slot) || slot < 1 || slot > MAX_SLOTS) {
        return ctx.reply(`Slot must be a number between 1 and ${MAX_SLOTS}. Format is \`server-shop set <slot> @role <price>\``);
    }
    if (!role) return ctx.reply("Please mention a role.");
    if (role.id === ctx.guild.id) return ctx.reply("You can't use @everyone as a shop item.");
    if (role.managed) return ctx.reply("That role is managed by a bot/integration and can't be assigned manually.");

    const botMember = ctx.guild.members.me;
    if (role.position >= botMember.roles.highest.position) {
        return ctx.reply(
            "I can't assign that role - it's positioned above or equal to my highest role. Move my role above it and try again.",
        );
    }
    if (!Number.isInteger(priceInput) || priceInput < 1) {
        return ctx.reply("Price must be a whole number of at least $1. Format is `a!server-shop set <slot> @role <price>`");
    }

    const db = client.db;
    const shop = await getShop(db, ctx.guild.id);
    shop[slot] = { roleId: role.id, price: priceInput };
    await db.set(shopKey(ctx.guild.id), shop);

    const embed = new EmbedBuilder()
        .setTitle("✅ Item Set")
        .setDescription(`Slot **${slot}** is now **${role.name}** for **$${priceInput.toLocaleString()}**.`)
        .setColor(0x57f287)
        .setTimestamp();
    return ctx.reply({ embeds: [embed] });
}

async function handleRemove(ctx, client) {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return ctx.reply("You need the **Manage Roles** permission to configure the server shop.");
    }

    const slot = ctx.source === "slash" ? ctx.raw.options.getInteger("slot") : parseInt((ctx.restText || "").trim(), 10);
    if (!Number.isInteger(slot) || slot < 1 || slot > MAX_SLOTS) {
        return ctx.reply(`Slot must be a number between 1 and ${MAX_SLOTS}.`);
    }

    const db = client.db;
    const shop = await getShop(db, ctx.guild.id);
    if (!shop[slot]) return ctx.reply(`Slot **${slot}** is already empty.`);

    delete shop[slot];
    await db.set(shopKey(ctx.guild.id), shop);

    const embed = new EmbedBuilder()
        .setTitle("🗑️ Item Removed")
        .setDescription(`Slot **${slot}** has been cleared.`)
        .setColor(0x57f287)
        .setTimestamp();
    return ctx.reply({ embeds: [embed] });
}

async function handleBuy(ctx, client) {
    const slot = ctx.source === "slash" ? ctx.raw.options.getInteger("slot") : parseInt((ctx.restText || "").trim(), 10);
    if (!Number.isInteger(slot) || slot < 1 || slot > MAX_SLOTS) {
        return ctx.reply(`Slot must be a number between 1 and ${MAX_SLOTS}.`);
    }

    const db = client.db;
    const shop = await getShop(db, ctx.guild.id);
    const entry = shop[slot];
    if (!entry) return ctx.reply(`Slot **${slot}** doesn't have anything set.`);

    const role = ctx.guild.roles.cache.get(entry.roleId);
    if (!role) {
        return ctx.reply("That item's role no longer exists - please contact a server admin.");
    }
    if (ctx.member.roles.cache.has(role.id)) {
        return ctx.reply("You already have this role!");
    }

    const botMember = ctx.guild.members.me;
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return ctx.reply("I don't have the **Manage Roles** permission - please contact a server admin.");
    }
    if (role.position >= botMember.roles.highest.position) {
        return ctx.reply("I can't assign that role - it's positioned above or equal to my highest role. Please contact a server admin.");
    }

    const cash = (await db.get(`cash_${ctx.user.id}`)) ?? 0;
    if (cash < entry.price) {
        return ctx.reply(
            `You don't have enough cash - you need $${entry.price.toLocaleString()}, you have $${cash.toLocaleString()}.`,
        );
    }

    try {
        await ctx.member.roles.add(role);
    } catch (err) {
        console.error("Failed to add server-shop role:", err);
        return ctx.reply("Something went wrong granting the role - please contact a server admin. You haven't been charged.");
    }

    await db.sub(`cash_${ctx.user.id}`, entry.price);

    const embed = new EmbedBuilder()
        .setTitle("🛍️ Purchase Successful")
        .setDescription(`You bought **${role.name}** for **$${entry.price.toLocaleString()}**! The role has been added.`)
        .setColor(0x57f287)
        .setTimestamp();
    return ctx.reply({ embeds: [embed] });
}