const { getConfig } = require("../utils/spamStore");

const recentMessages = new Map();

function normalize(content) {
    return content.trim().toLowerCase().replace(/\s+/g, " ");
}

async function handleSpamDetection(message) {
    if (!message.guild) return;
    if (!message.content) return;

    const config = await getConfig(message.client.db, message.guild.id);
    if (!config.enabled) return;

    const key = `${message.guild.id}:${message.author.id}`;
    const text = normalize(message.content);
    const now = Date.now();

    const entry = recentMessages.get(key);

    if (entry && entry.text === text && now - entry.firstSeen < config.windowMs) {
        entry.count += 1;
        entry.messageIds.push(message.id);
    } else {
        recentMessages.set(key, {
            text,
            count: 1,
            firstSeen: now,
            messageIds: [message.id],
            windowMs: config.windowMs,
        });
        return;
    }

    const current = recentMessages.get(key);
    if (current.count < config.threshold) return;

    recentMessages.delete(key);

    const shouldDelete = config.action === "delete" || config.action === "delete_timeout";
    const shouldTimeout = config.action === "timeout" || config.action === "delete_timeout";

    if (shouldDelete) {
        for (const id of current.messageIds) {
            const msg = await message.channel.messages.fetch(id).catch(() => null);
            if (msg) await msg.delete().catch(() => { });
        }
    }

    if (shouldTimeout && message.member?.moderatable) {
        await message.member.timeout(config.timeoutMs, "Spam: repeated identical messages").catch(() => { });
    }

    await message.channel
        .send(`${message.author}, please stop sending the same message repeatedly.`)
        .catch(() => { });
}

const CLEANUP_INTERVAL_MS = 30_000;

setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of recentMessages) {
        if (now - entry.firstSeen > entry.windowMs) recentMessages.delete(key);
    }
}, CLEANUP_INTERVAL_MS);

module.exports = { handleSpamDetection };