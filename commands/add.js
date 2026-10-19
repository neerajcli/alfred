const { EmbedBuilder } = require("discord.js");
const { parseExpiry, formatExpiry } = require("../utils/time");

const USAGE_TIME = "`Never`, a duration like `30m`/`24h`/`7d`/`2w`/`3mo`/`1y`, or a date like `2026-08-01`";

module.exports = {
  name: "add",
  category: "Owner",
  description: "Add money, redeems, or premium to a user or server.",

  async execute(ctx, client) {
    if (!client.owners.includes(ctx.user.id)) {
      return ctx.reply("Only the bot-devs can run this command!");
    }

    const sub = ctx.getSubcommand();
    const parts = (ctx.restText || "").split(/ +/).filter(Boolean);

    if (!["money", "redeem", "premium"].includes(sub)) {
      return ctx.reply(
        "Usage: `add money <id> <amount>`, `add redeem <id> <amount>`, `add premium user <id> <duration>`, or `add premium server <server id> <duration>`",
      );
    }

    if (sub === "premium") {
      const type = parts[0];
      if (type !== "user" && type !== "server") {
        return ctx.reply("Usage: `add premium user <id or @mention> <duration>` or `add premium server <server id> <duration>`");
      }

      const rawId = parts[1];
      if (!rawId) return ctx.reply(`Usage: \`add premium ${type} <id> <duration>\``);

      const timeInput = parts.slice(2).join(" ");
      if (!timeInput) return ctx.reply(`Please specify a duration: ${USAGE_TIME}`);

      const expiry = parseExpiry(timeInput);
      if (!expiry) return ctx.reply(`Couldn't understand that time. Use ${USAGE_TIME}`);

      const storedTime = expiry.never ? "never" : expiry.timestamp;

      if (type === "user") {
        const id = rawId.replace(/[<@!>]/g, "");
        const user = await client.users.fetch(id).catch(() => null);
        if (!user) return ctx.reply("Could not find that user.");

        await client.db.set(`userpremium_${user.id}`, true);
        await client.db.set(`userpremiumtime_${user.id}`, storedTime);

        const embed = new EmbedBuilder()
          .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
          .setTitle("⭐ User Premium Granted")
          .setThumbnail(user.displayAvatarURL())
          .addFields({ name: "Expires", value: formatExpiry(storedTime), inline: true })
          .setColor(0x57f287)
          .setTimestamp();
        return ctx.reply({ embeds: [embed] });
      }

      const guild = client.guilds.cache.get(rawId);
      if (!guild) return ctx.reply("Could not find that server (must be one the bot is currently in).");

      await client.db.set(`serverpremium_${guild.id}`, true);
      await client.db.set(`serverpremiumtime_${guild.id}`, storedTime);

      const embed = new EmbedBuilder()
        .setTitle("⭐ Server Premium Granted")
        .setThumbnail(guild.iconURL())
        .addFields(
          { name: "Server", value: `${guild.name} (${guild.id})`, inline: false },
          { name: "Expires", value: formatExpiry(storedTime), inline: true },
        )
        .setColor(0x57f287)
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }

    const rawId = parts[0];
    if (!rawId) return ctx.reply(`Usage: \`add ${sub} <id or @mention> <amount>\``);

    const id = rawId.replace(/[<@!>]/g, "");
    const user = await client.users.fetch(id).catch(() => null);
    if (!user) return ctx.reply("Could not find that user.");

    const amount = Number(parts[1]);
    if (!parts[1] || isNaN(amount) || amount <= 0) {
      return ctx.reply(`Please specify a correct amount of ${sub === "money" ? "money" : "redeems"} to add.`);
    }

    const key = (sub === "money" ? "cash_" : "redeem_") + user.id;
    await client.db.add(key, amount);
    const newBalance = (await client.db.get(key)) ?? amount;

    const embed = new EmbedBuilder()
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setTitle(sub === "money" ? "💰 Money Added" : "🎟️ Redeem Added")
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "Amount", value: `+${amount.toLocaleString()}`, inline: true },
        { name: "New Balance", value: newBalance.toLocaleString(), inline: true },
      )
      .setColor(0x57f287)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};