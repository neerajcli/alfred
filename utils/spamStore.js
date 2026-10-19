const DEFAULTS = {
    enabled: false,
    threshold: 3,
    windowMs: 15_000,
    action: "warn",
    timeoutMs: 5 * 60_000,
};

function keyFor(guildId) {
    return `spamconfig_${guildId}`;
}

async function getConfig(db, guildId) {
    const stored = await db.get(keyFor(guildId));
    return { ...DEFAULTS, ...(stored || {}) };
}

async function setConfig(db, guildId, patch) {
    const current = await getConfig(db, guildId);
    const updated = { ...current, ...patch };
    await db.set(keyFor(guildId), updated);
    return updated;
}

module.exports = { DEFAULTS, getConfig, setConfig };