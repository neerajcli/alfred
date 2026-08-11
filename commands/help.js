const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { PREFIX: DEFAULT_PREFIX } = require("../config.json");

const HIDDEN_CATEGORIES = ["Owner"];

const CATEGORY_ICONS = {
  Utility: "🛠️",
  Moderation: "🔨",
  Fun: "🎉",
  Economy: "💰",
  Other: "📌",
  "Server Premium": "⭐",
  "User Premium": "⭐",
  Uncategorized: "📁",
};

function categoryIcon(category) {
  return CATEGORY_ICONS[category] || "📁";
}

module.exports = {
  category: "Other",
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List all commands, or show details about one.")
    .addStringOption((opt) =>
      opt
        .setName("command")
        .setDescription("Get details about a specific command")
        .setRequired(false)
        .setAutocomplete(true),
    ),

  allowPrefix: true,

  async autocomplete(interaction, client) {
    const focused = interaction.options.getFocused().toLowerCase();

    const matches = [...client.commands.values()]
      .filter((cmd) => cmd.data && !HIDDEN_CATEGORIES.includes(cmd.category))
      .map((cmd) => cmd.data.name)
      .filter((name, index, arr) => arr.indexOf(name) === index)
      .filter((name) => name.includes(focused))
      .sort()
      .slice(0, 25);

    await interaction.respond(matches.map((name) => ({ name, value: name })));
  },

  async execute(ctx, client) {
    const query = (ctx.source === "slash" ? ctx.getString("command") : ctx.getSubcommand())?.toLowerCase();

    if (query) {
      const command = client.commands.get(query);
      if (!command || HIDDEN_CATEGORIES.includes(command.category)) {
        const notFound = new EmbedBuilder()
          .setDescription(`❌ Couldn't find a command called \`${query}\`.`)
          .setColor(0xed4245);
        return ctx.reply({ embeds: [notFound] });
      }

      const name = command.data?.name || command.name;
      const type = !command.data ? "Prefix only" : command.allowPrefix === false ? "Slash only" : "Slash + Prefix";
      const typeIcon = type === "Slash only" ? "🔹" : type === "Prefix only" ? "🔸" : "🔷";

      const embed = new EmbedBuilder()
        .setAuthor({ name: `${client.user.username} • Command Help`, iconURL: client.user.displayAvatarURL() })
        .setTitle(`${categoryIcon(command.category)} ${client.capitalize(name) || name}`)
        .setDescription(command.data?.description || command.description || "*No description provided.*")
        .addFields(
          { name: "Category", value: `\`${command.category || "Uncategorized"}\``, inline: true },
          { name: "Available Via", value: `${typeIcon} ${type}`, inline: true },
        )
        .setColor(0x5865f2)
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ text: `Requested by ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
        .setTimestamp();

      if (command.aliases?.length) {
        embed.addFields({
          name: "Aliases",
          value: command.aliases.map((a) => `\`${a}\``).join("  •  "),
          inline: false,
        });
      }

      return ctx.reply({ embeds: [embed] });
    }

    const guildPrefix = (await client.db.get(`prefix_${ctx.guild.id}`)) || DEFAULT_PREFIX;

    const categories = new Map();
    const seen = new Set();
    for (const cmd of client.commands.values()) {
      if (seen.has(cmd)) continue;
      seen.add(cmd);
      if (HIDDEN_CATEGORIES.includes(cmd.category)) continue;

      const category = cmd.category || "Uncategorized";
      const name = cmd.data?.name || cmd.name;
      if (!categories.has(category)) categories.set(category, []);
      categories.get(category).push(name);
    }

    const totalCommands = [...categories.values()].reduce((sum, names) => sum + names.length, 0);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${client.user.username} • Command Menu`, iconURL: client.user.displayAvatarURL() })
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(
        [
          `Here's everything I can do — **${totalCommands}** command${totalCommands === 1 ? "" : "s"} across **${categories.size}** categor${categories.size === 1 ? "y" : "ies"}.`,
          "",
          `💬 Prefix: \`${guildPrefix}\`  •  🔹 Slash: \`/\``,
          `Use \`${guildPrefix}help <command>\` or \`/help command:<command>\` for details on a specific one.`,
        ].join("\n"),
      )
      .setColor(0x5865f2)
      .setFooter({ text: `Requested by ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
      .setTimestamp();

    const sortedCategories = [...categories.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [category, names] of sortedCategories) {
      names.sort();
      const value = names.map((n) => `\`${guildPrefix}${n}\``).join(", ");
      embed.addFields({
        name: `${categoryIcon(category)} ${category} — ${names.length}`,
        value,
        inline: false,
      });
    }

    return ctx.reply({ embeds: [embed] });
  },
};