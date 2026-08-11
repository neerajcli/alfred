const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

function latencyColor(ms) {
  if (ms < 150) return 0x57f287;
  if (ms < 400) return 0xfee75c;
  return 0xed4245;
}

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder().setName("ping").setDescription("Check the bot's latency."),

  allowPrefix: true,

  async execute(ctx, client) {

    const botLatency = Date.now() - ctx.raw.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);
    const color = latencyColor(Math.max(botLatency, apiLatency));

    const embed = new EmbedBuilder()
      .setTitle("🏓 Pong!")
      .addFields(
        { name: "✎ Bot Latency", value: `\`${botLatency}ms\``, inline: true },
        { name: "✎ API Latency", value: `\`${apiLatency}ms\``, inline: true },
      )
      .setColor(color)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};