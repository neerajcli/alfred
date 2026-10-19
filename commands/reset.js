module.exports = {
  name: "reset",
  category: "Owner",
  description: "Wipe all stored data for a user or server ID.",

  async execute(ctx, client) {
    if (!client.owners.includes(ctx.user.id)) {
      return ctx.reply("Only bot devs can use this command!");
    }

    const parts = (ctx.fullText || "").split(/ +/).filter(Boolean);
    const rawId = parts[0];
    if (!rawId) {
      return ctx.reply("Usage: `reset <id or @mention>`");
    }
    const id = rawId.replace(/[<@!>]/g, "");
    const user = await client.users.fetch(id).catch(() => null);
    if (!user) return ctx.reply("Could not find that user.");
    const targetId = user.id;

    const allEntries = await client.db.all();

    const keys = allEntries
      .map((entry) => entry.id)
      .filter((id) => id.split("_").some((segment) => segment.includes(targetId)));

    if (keys.length === 0) {
      return ctx.reply(`No stored data found for \`${targetId}\`.`);
    }

    for (const key of keys) {
      await client.db.delete(key);
    }

    const preview =
      keys.length > 20 ? `${keys.slice(0, 20).join(", ")}, ...and ${keys.length - 20} more` : keys.join(", ");

    return ctx.reply(`Successfully reset \`${targetId}\` - deleted ${keys.length} key(s): \`${preview}\``);
  },
};