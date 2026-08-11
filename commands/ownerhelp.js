const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ownerhelp",
  category: "Owner",
  description: "List all owner-only commands.",

  async execute(ctx, client) {
    if (!client.owners.includes(ctx.user.id)) {
      return ctx.reply("Only bot-devs can use this command.");
    }

    const seen = new Set();
    const entries = [];
    for (const cmd of client.commands.values()) {
      if (seen.has(cmd)) continue;
      seen.add(cmd);
      if (cmd.category !== "Owner") continue;

      const name = cmd.data?.name || cmd.name;
      const description = cmd.data?.description || cmd.description || "No description.";
      const aliasNote = cmd.aliases?.length ? ` _(aka \`${cmd.aliases.join("`, `")}\`)_` : "";
      entries.push({ name, description, aliasNote });
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    const embed = new EmbedBuilder()
      .setAuthor({ name: "Owner Command Reference", iconURL: client.user.displayAvatarURL() })
      .setTitle("🔧 Owner Commands")
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(
        entries.length
          ? entries.map((e) => `**\`${e.name}\`**${e.aliasNote}\n${e.description}`).join("\n\n")
          : "No owner-only commands found.",
      )
      .setColor(0x2c2f33)
      .setFooter({ text: `${entries.length} owner command${entries.length === 1 ? "" : "s"}` })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};