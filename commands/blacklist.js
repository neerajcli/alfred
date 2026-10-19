const { EmbedBuilder } = require("discord.js");
const { parseExpiry, formatExpiry } = require("../utils/time");
const { syncEnforcement } = require("./wordmod");

module.exports = {
  name: "blacklist",
  category: "Owner",
  description: "Blacklist a user or server from using the bot.",

  async execute(ctx, client) {
    if (!client.owners.includes(ctx.user.id)) {
      return ctx.reply("Only the bot-devs can run this command!");
    }

    const sub = ctx.getSubcommand();
    const parts = (ctx.restText || "").split(/ +/).filter(Boolean);
    const USAGE_TIME = "`Never`, a duration like `30m`/`24h`/`7d`/`2w`/`3mo`/`1y`, or a date like `2026-08-01`";

    if (sub === "user") {
      const rawId = parts[0];
      if (!rawId) {
        return ctx.reply("Usage: `blacklist user <id or @mention> <time> <reason>`");
      }

      const id = rawId.replace(/[<@!>]/g, "");
      const user = await client.users.fetch(id).catch(() => null);
      if (!user) return ctx.reply("Could not find that user.");
      if (client.owners.includes(user.id)) return ctx.reply("I can't blacklist my owner.");

      const timeInput = parts[1];
      if (!timeInput) return ctx.reply(`Please specify a time: ${USAGE_TIME}`);

      const expiry = parseExpiry(timeInput);
      if (!expiry) return ctx.reply(`Couldn't understand that time. Use ${USAGE_TIME}`);

      const reason = parts.slice(2).join(" ");
      if (!reason) return ctx.reply("Please provide a reason!");

      const alreadyBlacklisted = (await client.db.get("bl_" + user.id)) === true;
      if (alreadyBlacklisted) return ctx.reply(`${user.tag} is already blacklisted.`);

      const storedTime = expiry.never ? "never" : expiry.timestamp;
      await client.db.set("bltime_" + user.id, storedTime);
      await client.db.set("blreason_" + user.id, reason);
      await client.db.set("bl_" + user.id, true);

      const embed = new EmbedBuilder()
        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
        .setTitle("🚫 User Blacklisted")
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "Expires", value: formatExpiry(storedTime), inline: true },
          { name: "Reason", value: reason, inline: false },
        )
        .setColor(0xed4245)
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    }

    if (sub === "server") {
      const guildId = parts[0];
      if (!guildId) {
        return ctx.reply("Usage: `blacklist server <server id> <time> <reason>`");
      }

      const guild = client.guilds.cache.get(guildId);
      if (!guild) return ctx.reply("Could not find that server (must be one the bot is currently in).");

      const timeInput = parts[1];
      if (!timeInput) return ctx.reply(`Please specify a time: ${USAGE_TIME}`);

      const expiry = parseExpiry(timeInput);
      if (!expiry) return ctx.reply(`Couldn't understand that time. Use ${USAGE_TIME}`);

      const reason = parts.slice(2).join(" ");
      if (!reason) return ctx.reply("Please provide a reason!");

      const alreadyBlacklisted = (await client.db.get("blguild_" + guild.id)) === true;
      if (alreadyBlacklisted) return ctx.reply(`${guild.name} is already blacklisted.`);

      const storedTime = expiry.never ? "never" : expiry.timestamp;
      await client.db.set("blguildtime_" + guild.id, storedTime);
      await client.db.set("blguildreason_" + guild.id, reason);
      await client.db.set("blguild_" + guild.id, true);

      await syncEnforcement(client, guild.id).catch((err) =>
        console.error(`Failed to sync word moderation after blacklisting ${guild.id}:`, err),
      );

      const embed = new EmbedBuilder()
        .setTitle("🚫 Server Blacklisted")
        .setThumbnail(guild.iconURL())
        .addFields(
          { name: "Server", value: `${guild.name} (${guild.id})`, inline: false },
          { name: "Expires", value: formatExpiry(storedTime), inline: true },
          { name: "Reason", value: reason, inline: false },
        )
        .setColor(0xed4245)
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    }

    return ctx.reply("Usage: `blacklist user <id> <time> <reason>` or `blacklist server <id> <time> <reason>`");
  },
};