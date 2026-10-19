const { EmbedBuilder } = require("discord.js");
const { parseDurationSpec, describeDurationSpec } = require("../utils/time");

function makeCode(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

module.exports = {
  name: "promocode",
  category: "Owner",
  description: "Generate a premium promocode for a user or server.",

  async execute(ctx, client) {
    if (!client.owners.includes(ctx.user.id)) {
      return ctx.reply("Only bot-devs can use this command.");
    }

    const type = ctx.getSubcommand();
    if (!["user", "server"].includes(type)) {
      return ctx.reply("Usage: `promocode user generate <time>` or `promocode server generate <time>`");
    }

    const rest = (ctx.restText || "").split(/ +/).filter(Boolean);
    const action = rest[0]?.toLowerCase();
    if (action !== "generate") {
      return ctx.reply(`Usage: \`promocode ${type} generate <time>\``);
    }

    const timeInput = rest.slice(1).join(" ");
    if (!timeInput) {
      return ctx.reply("Please specify a duration (e.g. `30d`, `1y`) or `Never` for permanent.");
    }

    const spec = parseDurationSpec(timeInput);
    if (!spec) {
      return ctx.reply("Couldn't understand that duration. Try something like `30d`, `1y`, `Never`, or a date.");
    }

    const code = makeCode(10);

    await client.db.set(`promo_${type}_${code}`, {
      expirySpec: spec,
      createdAt: Date.now(),
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎁 ${type === "user" ? "User" : "Server"} Promocode Generated`)
      .addFields(
        { name: "Code", value: `\`${code}\``, inline: true },
        { name: "Type", value: type === "user" ? "User Premium" : "Server Premium", inline: true },
        { name: "Grants", value: describeDurationSpec(spec), inline: false },
      )
      .setColor(0x9b59b6)
      .setFooter({ text: "Keep this code safe - it can only be redeemed once." })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};