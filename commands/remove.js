const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "remove",
  category: "Owner",
  description: "Remove money, redeems, or premium from a user or server.",

  async execute(ctx, client) {
    if (!client.owners.includes(ctx.user.id)) {
      return ctx.reply("Only the bot-devs can run this command!");
    }

    const sub = ctx.getSubcommand();
    const parts = (ctx.restText || "").split(/ +/).filter(Boolean);

    if (!["money", "redeem", "premium"].includes(sub)) {
      return ctx.reply(
        "Usage: `remove money <id> <amount>`, `remove redeem <id> <amount>`, `remove premium user <id>`, or `remove premium server <server id>`",
      );
    }

    if (sub === "premium") {
      const type = parts[0];
      if (type !== "user" && type !== "server") {
        return ctx.reply("Usage: `remove premium user <id or @mention>` or `remove premium server <server id>`");
      }

      const rawId = parts[1];
      if (!rawId) return ctx.reply(`Usage: \`remove premium ${type} <id>\``);

      if (type === "user") {
        const id = rawId.replace(/[<@!>]/g, "");
        const user = await client.users.fetch(id).catch(() => null);
        if (!user) return ctx.reply("Could not find that user.");

        const hasPremium = (await client.db.get(`userpremium_${user.id}`)) === true;
        if (!hasPremium) return ctx.reply(`${user.tag} doesn't have premium.`);

        await client.db.delete(`userpremium_${user.id}`);
        await client.db.delete(`userpremiumtime_${user.id}`);

        const embed = new EmbedBuilder()
          .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
          .setTitle("⭐ User Premium Removed")
          .setThumbnail(user.displayAvatarURL())
          .setDescription(`${user} no longer has premium.`)
          .setColor(0xed4245)
          .setTimestamp();
        return ctx.reply({ embeds: [embed] });
      }

      const guild = client.guilds.cache.get(rawId);
      if (!guild) return ctx.reply("Could not find that server (must be one the bot is currently in).");

      const hasPremium = (await client.db.get(`serverpremium_${guild.id}`)) === true;
      if (!hasPremium) return ctx.reply(`${guild.name} doesn't have premium.`);

      await client.db.delete(`serverpremium_${guild.id}`);
      await client.db.delete(`serverpremiumtime_${guild.id}`);

      const embed = new EmbedBuilder()
        .setTitle("⭐ Server Premium Removed")
        .setThumbnail(guild.iconURL())
        .setDescription(`**${guild.name}** no longer has premium.`)
        .setColor(0xed4245)
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }

    const rawId = parts[0];
    if (!rawId) return ctx.reply(`Usage: \`remove ${sub} <id or @mention> <amount>\``);

    const id = rawId.replace(/[<@!>]/g, "");
    const user = await client.users.fetch(id).catch(() => null);
    if (!user) return ctx.reply("Could not find that user.");

    const amount = Number(parts[1]);
    if (!parts[1] || isNaN(amount) || amount <= 0) {
      return ctx.reply(`Please specify a correct amount of ${sub === "money" ? "money" : "redeems"} to remove.`);
    }

    const key = (sub === "money" ? "cash_" : "redeem_") + user.id;
    await client.db.sub(key, amount);
    const newBalance = (await client.db.get(key)) ?? 0;

    const embed = new EmbedBuilder()
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setTitle(sub === "money" ? "💸 Money Removed" : "🎟️ Redeem Removed")
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "Amount", value: `-${amount.toLocaleString()}`, inline: true },
        { name: "New Balance", value: newBalance.toLocaleString(), inline: true },
      )
      .setColor(0xed4245)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};