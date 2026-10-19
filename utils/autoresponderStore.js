function keyFor(guildId) {
    return `autoresponders_${guildId}`;
}

async function getResponders(db, guildId) {
    const entries = await db.get(keyFor(guildId));
    return entries || [];
}

async function addResponder(db, guildId, trigger, reply, matchType = "includes") {
    const entries = await getResponders(db, guildId);

    const exists = entries.some((e) => e.trigger.toLowerCase() === trigger.toLowerCase());
    if (exists) return false;

    entries.push({ trigger, reply, matchType });
    await db.set(keyFor(guildId), entries);
    return true;
}

async function removeResponder(db, guildId, trigger) {
    const entries = await getResponders(db, guildId);
    const before = entries.length;

    const filtered = entries.filter((e) => e.trigger.toLowerCase() !== trigger.toLowerCase());
    await db.set(keyFor(guildId), filtered);

    return filtered.length < before;
}

module.exports = { getResponders, addResponder, removeResponder };