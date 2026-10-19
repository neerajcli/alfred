const { MessageFlags } = require("discord.js");

function fromInteraction(interaction) {
  return {
    source: "slash",
    raw: interaction,
    user: interaction.user,
    member: interaction.member,
    guild: interaction.guild,
    channel: interaction.channel,
    fullText: null,
    reply: (payload) => {
      if (typeof payload === "string") return interaction.reply(payload);
      if (!payload?.ephemeral) return interaction.reply(payload);

      const { ephemeral, flags, ...rest } = payload;
      return interaction.reply({ ...rest, flags: (flags || 0) | MessageFlags.Ephemeral });
    },
    getString: (name) => interaction.options.getString(name),
    getUser: (name) => interaction.options.getUser(name),
    getInteger: (name) => interaction.options.getInteger(name),
    getSubcommand: () => {
      try {
        return interaction.options.getSubcommand(false);
      } catch {
        return null;
      }
    },
  };
}

function fromMessage(message, args, optionOrder = []) {
  const positional = {};
  optionOrder.forEach((optName, i) => {
    positional[optName] = args[i];
  });

  const subcommand = args[0]?.toLowerCase() || null;
  const restText = args.slice(1).join(" ");

  return {
    source: "message",
    raw: message,
    user: message.author,
    member: message.member,
    guild: message.guild,
    channel: message.channel,
    fullText: args.join(" "),
    restText,
    reply: (payload) => {
      if (typeof payload === "string") return message.reply(payload);
      const { ephemeral, ...rest } = payload;
      return message.reply(rest);
    },
    getString: (name) => positional[name] ?? null,
    getUser: (name) => {
      const raw = positional[name];
      if (!raw) return null;
      const id = raw.replace(/[<@!>]/g, "");
      return message.mentions.users.get(id) || message.client.users.cache.get(id);
    },
    getInteger: (name) => {
      const raw = positional[name];
      const parsed = parseInt(raw, 10);
      return Number.isNaN(parsed) ? null : parsed;
    },
    getSubcommand: () => subcommand,
  };
}

module.exports = { fromInteraction, fromMessage };