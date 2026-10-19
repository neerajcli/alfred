const { EmbedBuilder } = require("discord.js");
const { syncEnforcement } = require("./wordmod");

module.exports = {
  name: "whitelist",
  category: "Owner",
  description: "Whitelist a user or server (removes an existing blacklist).",

  async execute(ctx, client) {
    if (!client.owners.includes(ctx.user.id)) {
      return ctx.reply("Only the bot-devs can run this command!");
    }

    const sub = ctx.getSubcommand();
    const parts = (ctx.restText || "").split(/ +/).filter(Boolean);

    if (sub === "user") {
      const rawId = parts[0];
      if (!rawId) return ctx.reply("Usage: `whitelist user <id or @mention>`");

      const id = rawId.replace(/[<@!>]/g, "");
      const user = await client.users.fetch(id).catch(() => null);
      if (!user) return ctx.reply("Could not find that user.");

      const isBlacklisted = (await client.db.get("bl_" + user.id)) === true;
      if (!isBlacklisted) return ctx.reply(`${user.tag} isn't blacklisted.`);

      await client.db.delete("bl_" + user.id);
      await client.db.delete("blreason_" + user.id);
      await client.db.delete("bltime_" + user.id);

      const embed = new EmbedBuilder()
        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
        .setTitle("✅ User Whitelisted")
        .setThumbnail(user.displayAvatarURL())
        .setDescription(`${user} can use the bot again.`)
        .setColor(0x57f287)
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    }

    if (sub === "server") {
      const guildId = parts[0];
      if (!guildId) return ctx.reply("Usage: `whitelist server <server id>`");

      const guild = client.guilds.cache.get(guildId);
      if (!guild) return ctx.reply("Could not find that server (must be one the bot is currently in).");

      const isBlacklisted = (await client.db.get("blguild_" + guild.id)) === true;
      if (!isBlacklisted) return ctx.reply(`${guild.name} isn't blacklisted.`);

      await client.db.delete("blguild_" + guild.id);
      await client.db.delete("blguildtime_" + guild.id);
      await client.db.delete("blguildreason_" + guild.id);

      await syncEnforcement(client, guild.id).catch((err) =>
        console.error(`Failed to sync word moderation after whitelisting ${guild.id}:`, err),
      );

      const embed = new EmbedBuilder()
        .setTitle("✅ Server Whitelisted")
        .setThumbnail(guild.iconURL())
        .setDescription(`**${guild.name}** can use the bot again.`)
        .setColor(0x57f287)
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    }

    return ctx.reply("Usage: `whitelist user <id>` or `whitelist server <id>`");
  },
};