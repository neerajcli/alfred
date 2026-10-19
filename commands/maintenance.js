const { EmbedBuilder } = require("discord.js");
const { syncAllEnforcement } = require("./wordmod");

module.exports = {
  name: "maintenance",
  category: "Owner",
  description: "Start or stop the bot's maintenance mode.",

  async execute(ctx, client) {
    if (!client.owners.includes(ctx.user.id)) {
      return ctx.reply("Only the bot-devs can run this command!");
    }

    const sub = ctx.getSubcommand();
    const isActive = (await client.db.get("maintenance_")) === true;

    if (sub === "on") {
      if (isActive) {
        return ctx.reply("Maintenance mode is already on. Use `maintenance off` first if you want to change the details.");
      }

      const [timePart, ...msgParts] = (ctx.restText || "").split("|");
      const time = timePart?.trim() || "No ETA";
      const customMessage = msgParts.join("|").trim() || "No additional details provided.";

      await client.db.set("maintenance_", true);
      await client.db.set("maintenancetime_", time);
      await client.db.set("maintenancemessage_", customMessage);
      await client.db.set("maintenancestarted_", Date.now());

      await syncAllEnforcement(client).catch((err) =>
        console.error("Failed to sync word moderation for maintenance start:", err),
      );

      const embed = new EmbedBuilder()
        .setTitle("🛠️ Maintenance Started")
        .setDescription("The bot's maintenance mode is now active.")
        .addFields(
          { name: "End time", value: time, inline: true },
          { name: "Details", value: customMessage, inline: false },
        )
        .setColor(0xed4245)
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    }

    if (sub === "off") {
      if (!isActive) {
        return ctx.reply("Maintenance mode isn't on right now.");
      }

      await client.db.delete("maintenance_");
      await client.db.delete("maintenancetime_");
      await client.db.delete("maintenancemessage_");
      await client.db.delete("maintenancestarted_");

      await syncAllEnforcement(client).catch((err) =>
        console.error("Failed to sync word moderation for maintenance end:", err),
      );

      const embed = new EmbedBuilder()
        .setTitle("✅ Maintenance Ended")
        .setDescription("The bot's maintenance mode has been turned off.")
        .setColor(0x57f287)
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    }

    return ctx.reply("Usage: `maintenance on <eta> | <message>` or `maintenance off`");
  },
};