const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "shutdown",
  category: "Owner",
  description: "Shuts down the bot.",

  async execute(ctx, client) {
    if (!client.owners.includes(ctx.user.id)) return;

    const embed = new EmbedBuilder()
      .setTitle("🔌 Shutting Down")
      .setDescription("Goodbye!")
      .setColor(0xed4245)
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });

    client.destroy();
    process.exit(0);
  },
};