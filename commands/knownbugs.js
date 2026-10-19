const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const MAX_SHOWN = 20;

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder().setName("knownbugs").setDescription("View the list of currently known bugs."),

  allowPrefix: true,

  async execute(ctx, client) {
    const bugs = (await client.db.get("knownbugs")) || [];

    if (bugs.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle("🐞 Known Bugs")
        .setDescription("No known bugs right now! If you find one, report it with `/report bug`.")
        .setColor(0x57f287)
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }

    const shown = bugs.slice(0, MAX_SHOWN);
    const list = shown.map((bug, i) => `**${i + 1}.** ${bug}`).join("\n");
    const overflowNote = bugs.length > MAX_SHOWN ? `\n\n*...and ${bugs.length - MAX_SHOWN} more.*` : "";

    const embed = new EmbedBuilder()
      .setTitle("🐞 Known Bugs")
      .setDescription(list + overflowNote)
      .setColor(0xfee75c)
      .setFooter({ text: `${bugs.length} known bug${bugs.length === 1 ? "" : "s"} - found something new? Use /report bug` })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};