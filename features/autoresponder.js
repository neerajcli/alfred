const { getResponders } = require("../utils/autoresponderStore");
const { isExpired } = require("../utils/time");

const COOLDOWN_MS = 5000;

function matches(content, entry) {
    const lower = content.toLowerCase();

    if (entry.matchType === "regex") {
        try {
            return new RegExp(entry.trigger, "i").test(content);
        } catch {
            return false;
        }
    }

    if (entry.matchType === "exact") {
        return lower === entry.trigger.toLowerCase();
    }

    return lower.includes(entry.trigger.toLowerCase());
}

function cooldownKey(channelId, trigger) {
    return `arcooldown_${channelId}_${trigger}`;
}

async function handleAutoresponder(message) {
    if (!message.guild) return;

    const db = message.client.db;
    const entries = await getResponders(db, message.guild.id);
    if (entries.length === 0) return;

    for (const entry of entries) {
        if (!matches(message.content, entry)) continue;

        const key = cooldownKey(message.channel.id, entry.trigger);
        const expiry = await db.get(key);
        if (expiry != null && !isExpired(expiry)) return;

        await db.set(key, Date.now() + COOLDOWN_MS);
        await message.reply(entry.reply).catch(() => { });
        return;
    }
}

module.exports = { handleAutoresponder };