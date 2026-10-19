const lastDeleted = new Map();

const cleanupTimeouts = new Map();

const MAX_AGE_MS = 60 * 60_000;

function scheduleCleanup(channelId) {
    const existing = cleanupTimeouts.get(channelId);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(() => {
        lastDeleted.delete(channelId);
        cleanupTimeouts.delete(channelId);
    }, MAX_AGE_MS);

    cleanupTimeouts.set(channelId, timeout);
}

async function handleMessageDelete(message) {
    if (message.partial) {
        message = await message.fetch().catch(() => null);
        if (!message) return;
    }

    if (!message.guild) return;
    if (message.author?.bot) return;

    const hasContent = !!message.content;
    const attachmentUrls = message.attachments ? [...message.attachments.values()].map((a) => a.url) : [];
    if (!hasContent && attachmentUrls.length === 0) return;

    lastDeleted.set(message.channel.id, {
        content: message.content || null,
        authorId: message.author?.id ?? null,
        authorTag: message.author?.tag ?? "Unknown User",
        authorAvatarURL: message.author?.displayAvatarURL?.() ?? null,
        attachmentUrls,
        deletedAt: Date.now(),
    });

    scheduleCleanup(message.channel.id);
}

function getLastDeleted(channelId) {
    return lastDeleted.get(channelId) || null;
}

module.exports = { handleMessageDelete, getLastDeleted };