module.exports = {
    name: "bug",
    category: "Owner",
    description: "Manage the /knownbugs list. Usage: bug add <text> | bug remove <number>",
  
    async execute(ctx, client) {
      if (!client.owners.includes(ctx.user.id)) {
        return ctx.reply("This command is owner-only.");
      }
  
      const db = client.db;
      const sub = ctx.getSubcommand();
  
      if (sub === "add") {
        const bugText = ctx.restText?.trim();
        if (!bugText) return ctx.reply("Usage: `bug add <bug description>`");
  
        const bugs = (await db.get("knownbugs")) || [];
        bugs.push(bugText);
        await db.set("knownbugs", bugs);
  
        return ctx.reply(`✅ Added to known bugs (#${bugs.length}): ${bugText}`);
      }
  
      if (sub === "remove") {
        const indexArg = ctx.restText?.trim();
        const index = parseInt(indexArg, 10);
  
        const bugs = (await db.get("knownbugs")) || [];
        if (!Number.isInteger(index) || index < 1 || index > bugs.length) {
          return ctx.reply(
            `Usage: \`bug remove <number>\` - check the current numbering with \`/knownbugs\` first (currently ${bugs.length} entr${bugs.length === 1 ? "y" : "ies"}).`,
          );
        }
  
        const [removed] = bugs.splice(index - 1, 1);
        await db.set("knownbugs", bugs);
  
        return ctx.reply(`🗑️ Removed known bug #${index}: ${removed}`);
      }
  
      return ctx.reply("Usage: `bug add <text>` or `bug remove <number>`");
    },
  };