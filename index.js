const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Events,
  EmbedBuilder,
  REST,
  Routes,
  MessageFlags,
} = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { TOKEN, CLIENT_ID, LOG_CHANNEL_ID, PREFIX } = require("./config.json");
const { fromInteraction, fromMessage } = require("./utils/context");
const { isExpired, formatExpiry } = require("./utils/time");
const owners = ["504635146553524234"];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message],
});

client.db = new (require("quick.db").QuickDB)();
client.commands = new Collection();
client.owners = owners;

client.commandMentions = new Map();

client.mentionCommand = (name) => {
  const id = client.commandMentions.get(name);
  return id ? `</${name}:${id}>` : `\`${name}\``;
};

const cmdFiles = readdirSync(join(__dirname, "commands")).filter((file) =>
  file.endsWith(".js"),
);
for (const file of cmdFiles) {
  const command = require(join(__dirname, "commands", file));
  const name = command.data?.name || command.name;

  if (!name || !command.execute) {
    console.warn(`[WARN] Skipping ${file}: missing "data"/"name" or "execute".`);
    continue;
  }
  if (!command.category) {
    console.warn(`[WARN] ${file} has no "category" - will show under "Uncategorized" in /help.`);
  }
  if (!command.data) command.allowPrefix = true;
  client.commands.set(name, command);

  for (const alias of command.aliases || []) {
    if (client.commands.has(alias)) {
      console.warn(`[WARN] Alias "${alias}" on ${file} collides with an existing command/alias - skipped.`);
      continue;
    }
    client.commands.set(alias, command);
  }
}

async function registerCommands() {
  const rest = new REST().setToken(TOKEN);

  const seenNames = new Set();
  const localCommands = [];
  for (const c of client.commands.values()) {
    if (!c.data || seenNames.has(c.data.name)) continue;
    seenNames.add(c.data.name);
    localCommands.push(c.data.toJSON());
  }

  try {
    console.log(`Syncing ${localCommands.length} slash command(s)...`);
    const data = await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: localCommands },
    );
    console.log(`Successfully synced ${data.length} command(s).`);
    storeCommandMentions(data);
  } catch (err) {
    console.error("Failed to register slash commands:", err);
  }
}

function storeCommandMentions(commands) {
  client.commandMentions = new Map(commands.map((c) => [c.name, c.id]));
}

client.once(Events.ClientReady, async (c) => {
  c.user.setActivity("https://alfredbot.statuspage.io/. Ping for prefix!", {
    type: 3,
  });
  console.log(`Bot is ready. Logged in as ${c.user.tag}`);

  await registerCommands();

  const initialized = new Set();
  for (const command of client.commands.values()) {
    if (initialized.has(command) || typeof command.init !== "function") continue;
    initialized.add(command);
    try {
      await command.init(client);
    } catch (err) {
      console.error(`init() failed for ${command.data?.name || command.name}:`, err);
    }
  }
});

async function isPremiumActive(flagKey, timeKey) {
  const active = await client.db.get(flagKey);
  if (active !== true) return false;

  const expiry = await client.db.get(timeKey);
  if (isExpired(expiry)) {
    await client.db.delete(flagKey);
    await client.db.delete(timeKey);
    return false;
  }
  return true;
}

async function isGuildBlacklistActive(guildId) {
  const active = await client.db.get(`blguild_${guildId}`);
  if (active !== true) return false;

  const expiry = await client.db.get(`blguildtime_${guildId}`);
  if (isExpired(expiry)) {
    await client.db.delete(`blguild_${guildId}`);
    await client.db.delete(`blguildtime_${guildId}`);
    await client.db.delete(`blguildreason_${guildId}`);
    return false;
  }
  return true;
}

async function isUserBlacklistActive(userId) {
  const active = await client.db.get("bl_" + userId);
  if (active !== true) return false;

  const expiry = await client.db.get("bltime_" + userId);
  if (isExpired(expiry)) {
    await client.db.delete("bl_" + userId);
    await client.db.delete("bltime_" + userId);
    await client.db.delete("blreason_" + userId);
    return false;
  }
  return true;
}

async function expirePremiumIfNeeded(userId, guildId) {
  await isPremiumActive(`userpremium_${userId}`, `userpremiumtime_${userId}`);
  if (guildId) await isPremiumActive(`serverpremium_${guildId}`, `serverpremiumtime_${guildId}`);
}

async function checkInteractionAccess(interaction, commandName) {
  const userId = interaction.user.id;
  const guildId = interaction.guild?.id;
  const isOwner = client.owners.includes(userId);
  const exemptFromBlacklist = isOwner || commandName === "appeal";

  if (!exemptFromBlacklist) {
    if (await isUserBlacklistActive(userId)) {
      const storedTime = await client.db.get("bltime_" + userId);
      const reason = (await client.db.get("blreason_" + userId)) || "No reason provided";
      return new EmbedBuilder()
        .setTitle("🚫 You are currently blacklisted!")
        .setDescription("You can't use this until the blacklist expires or is lifted.")
        .addFields(
          { name: "Expires", value: formatExpiry(storedTime), inline: true },
          { name: "Reason", value: reason, inline: true },
        )
        .setColor(0xed4245)
        .setFooter({ text: "Think this is a mistake? Use the appeal command." })
        .setTimestamp();
    }

    if (guildId && await isGuildBlacklistActive(guildId)) {
      const storedTime = await client.db.get("blguildtime_" + guildId);
      const reason = (await client.db.get("blguildreason_" + guildId)) || "No reason provided";
      return new EmbedBuilder()
        .setTitle("🚫 This server is currently blacklisted!")
        .setDescription("This can't be used here until the blacklist expires or is lifted.")
        .addFields(
          { name: "Expires", value: formatExpiry(storedTime), inline: true },
          { name: "Reason", value: reason, inline: true },
        )
        .setColor(0xed4245)
        .setFooter({ text: "Think this is a mistake? Use the appeal command." })
        .setTimestamp();
    }
  }

  if (!isOwner) {
    const maintenance = await client.db.get("maintenance_");
    if (maintenance === true) {
      const eta = (await client.db.get("maintenancetime_")) || "No ETA";
      const details = (await client.db.get("maintenancemessage_")) || "No additional details provided.";
      const started = await client.db.get("maintenancestarted_");

      return new EmbedBuilder()
        .setTitle("🛠️ Under Maintenance")
        .setDescription("Sorry, the bot is currently undergoing maintenance. Please try again later.")
        .addFields(
          { name: "Details", value: details, inline: false },
          {
            name: "Started",
            value: started
              ? `<t:${Math.floor(started / 1000)}:F> (<t:${Math.floor(started / 1000)}:R>)`
              : "Unknown",
            inline: true,
          },
          { name: "ETA", value: eta, inline: true },
        )
        .setColor(0xed4245)
        .setFooter({ text: "We appreciate your patience!" })
        .setTimestamp();
    }
  }

  return null;
}

async function handleCommand(command, ctx, label, fullInvocation) {
  const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
  const commandName = command.data?.name || command.name;
  const exempt = client.owners.includes(ctx.user.id) || commandName === "appeal";

  await expirePremiumIfNeeded(ctx.user.id, ctx.guild?.id);

  if (!exempt) {
    if (await isUserBlacklistActive(ctx.user.id)) {
      const storedTime = await client.db.get("bltime_" + ctx.user.id);
      const reason = (await client.db.get("blreason_" + ctx.user.id)) || "No reason provided";
      const embed = new EmbedBuilder()
        .setTitle("🚫 You are currently blacklisted!")
        .setDescription("You can't use commands until the blacklist expires or is lifted.")
        .addFields(
          { name: "Expires", value: formatExpiry(storedTime), inline: true },
          { name: "Reason", value: reason, inline: true },
        )
        .setColor(0xed4245)
        .setFooter({ text: "Think this is a mistake? Use the appeal command." })
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }

    if (ctx.guild && await isGuildBlacklistActive(ctx.guild.id)) {
      const storedTime = await client.db.get("blguildtime_" + ctx.guild.id);
      const reason = (await client.db.get("blguildreason_" + ctx.guild.id)) || "No reason provided";
      const embed = new EmbedBuilder()
        .setTitle("🚫 This server is currently blacklisted!")
        .setDescription("Commands can't be used here until the blacklist expires or is lifted.")
        .addFields(
          { name: "Expires", value: formatExpiry(storedTime), inline: true },
          { name: "Reason", value: reason, inline: true },
        )
        .setColor(0xed4245)
        .setFooter({ text: "Think this is a mistake? Use the appeal command." })
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    }
  }

  if (!client.owners.includes(ctx.user.id)) {
    const maintenance = await client.db.get("maintenance_");
    if (maintenance === true) {
      const eta = (await client.db.get("maintenancetime_")) || "No ETA";
      const details = (await client.db.get("maintenancemessage_")) || "No additional details provided.";
      const started = await client.db.get("maintenancestarted_");

      const embed = new EmbedBuilder()
        .setTitle("🛠️ Under Maintenance")
        .setDescription(
          "Sorry, the bot is currently undergoing maintenance and commands are temporarily unavailable. Please try again later.",
        )
        .addFields(
          { name: "Details", value: details, inline: false },
          {
            name: "Started",
            value: started
              ? `<t:${Math.floor(started / 1000)}:F> (<t:${Math.floor(started / 1000)}:R>)`
              : "Unknown",
            inline: true,
          },
          { name: "ETA", value: eta, inline: true },
        )
        .setColor(0xed4245)
        .setFooter({ text: "We appreciate your patience!" })
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    }
  }

  try {
    await command.execute(ctx, client);

    console.log(
      `${ctx.guild?.name}: ${ctx.user.tag} used ${label} in #${ctx.channel?.name} (${ctx.source})`,
    );

    if (logChannel) {
      const contentPreview = truncateForField(fullInvocation);
      const embed = new EmbedBuilder()
        .setAuthor({ name: `${ctx.user.tag} (${ctx.user.id})`, iconURL: ctx.user.displayAvatarURL() })
        .setTitle("📋 Command Used")
        .addFields(
          { name: "Command", value: `\`${label}\``, inline: true },
          { name: "Source", value: ctx.source === "slash" ? "Slash" : "Prefix", inline: true },
          { name: "Channel", value: `${ctx.channel}`, inline: true },
          { name: "Server", value: `${ctx.guild?.name ?? "Unknown"}`, inline: false },
          { name: "Server ID", value: `${ctx.guild?.id ?? "Unknown"}`, inline: false },
          { name: "Content", value: `\`\`\`${contentPreview}\`\`\``, inline: false },
        )
        .setColor(0x5865f2)
        .setThumbnail(ctx.user.displayAvatarURL())
        .setTimestamp();
      logChannel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error(err);

    if (logChannel) {
      const contentPreview = truncateForField(fullInvocation);
      const errorEmbed = new EmbedBuilder()
        .setAuthor({ name: `${ctx.user.tag} (${ctx.user.id})`, iconURL: ctx.user.displayAvatarURL() })
        .setTitle("⚠️ Command Error")
        .addFields(
          { name: "Command", value: `\`${label}\``, inline: true },
          { name: "Source", value: ctx.source === "slash" ? "Slash" : "Prefix", inline: true },
          { name: "Channel", value: `${ctx.channel}`, inline: true },
          { name: "Server", value: `${ctx.guild?.name ?? "Unknown"}`, inline: false },
          { name: "Server ID", value: `${ctx.guild?.id ?? "Unknown"}`, inline: false },
          { name: "Content", value: `\`\`\`${contentPreview}\`\`\``, inline: false },
          { name: "Error", value: `\`\`\`${String(err).slice(0, 950)}\`\`\``, inline: false },
        )
        .setColor(0xed4245)
        .setTimestamp();
      logChannel.send({ embeds: [errorEmbed] });
    }

    const replyPayload = {
      content: "I'm getting an error using this command! Please contact developers!",
      flags: MessageFlags.Ephemeral,
    };

    try {
      if (ctx.source === "slash" && (ctx.raw.replied || ctx.raw.deferred)) {
        await ctx.raw.followUp(replyPayload);
      } else {
        await ctx.reply(replyPayload);
      }
    } catch (replyErr) {
      console.error("Failed to send error reply:", replyErr);
    }
  }
}

async function checkAfkMentions(users, channel, guildId) {
  const seen = new Set();
  for (const user of users) {
    if (seen.has(user.id)) continue;
    seen.add(user.id);

    const afkStatus = await client.db.get(`afk_${user.id}`);
    if (afkStatus !== true) continue;

    if (!client.owners.includes(user.id)) {
      const maintenance = await client.db.get("maintenance_");
      if (maintenance === true) continue;

      if (await isUserBlacklistActive(user.id)) continue;

      if (guildId && (await isGuildBlacklistActive(guildId))) continue;
    }

    const afkReason = (await client.db.get(`afkreason_${user.id}`)) ?? "No Reason Provided";
    const embed = new EmbedBuilder()
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setTitle("💤 AFK")
      .setDescription(`${user} is currently AFK.`)
      .addFields({ name: "Reason", value: afkReason })
      .setColor(0xfee75c)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }
}

function extractMentionedUsers(options = []) {
  let users = [];
  for (const opt of options) {
    if (opt.user) users.push(opt.user);
    if (opt.options) users = users.concat(extractMentionedUsers(opt.options));
  }
  return users;
}

function formatSlashOptions(options = []) {
  return options
    .map((opt) => {
      if (opt.options) return `${opt.name} ${formatSlashOptions(opt.options)}`.trim();
      if (opt.user) return `${opt.name}:${opt.user.tag}`;
      if (opt.channel) return `${opt.name}:#${opt.channel.name}`;
      if (opt.role) return `${opt.name}:@${opt.role.name}`;
      return `${opt.name}:${opt.value}`;
    })
    .join(" ");
}

function formatSlashInvocation(interaction) {
  const optionsText = formatSlashOptions(interaction.options.data);
  return `/${interaction.commandName}${optionsText ? " " + optionsText : ""}`;
}

function truncateForField(text, max = 1000) {
  const safe = text ?? "";
  return safe.length > max ? safe.slice(0, max) + "…" : safe;
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.user?.bot) return;

  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command?.autocomplete) return;

    try {
      await command.autocomplete(interaction, client);
    } catch (err) {
      console.error(`Autocomplete error in /${interaction.commandName}:`, err);
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    const [commandName] = interaction.customId.split(":");
    const command = client.commands.get(commandName);
    if (!command?.handleModal) return;

    const blockedEmbed = await checkInteractionAccess(interaction, commandName);
    if (blockedEmbed) {
      return interaction.reply({ embeds: [blockedEmbed], flags: MessageFlags.Ephemeral }).catch(() => { });
    }

    try {
      await command.handleModal(interaction, client);
    } catch (err) {
      console.error(`Modal handling error for "${interaction.customId}":`, err);
      const replyPayload = { content: "Something went wrong submitting that form. Please try again.", flags: MessageFlags.Ephemeral };
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyPayload);
        } else {
          await interaction.reply(replyPayload);
        }
      } catch (replyErr) {
        console.error("Failed to send modal error reply:", replyErr);
      }
    }
    return;
  }

  if (interaction.isButton()) {
    const [commandName] = interaction.customId.split(":");
    const command = client.commands.get(commandName);
    if (!command?.handleButton) return;

    const blockedEmbed = await checkInteractionAccess(interaction, commandName);
    if (blockedEmbed) {
      return interaction.reply({ embeds: [blockedEmbed], flags: MessageFlags.Ephemeral }).catch(() => { });
    }

    try {
      await command.handleButton(interaction, client);
    } catch (err) {
      console.error(`Button handling error for "${interaction.customId}":`, err);
      const replyPayload = { content: "Something went wrong handling that button. Please try again.", flags: MessageFlags.Ephemeral };
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyPayload);
        } else {
          await interaction.reply(replyPayload);
        }
      } catch (replyErr) {
        console.error("Failed to send button error reply:", replyErr);
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const mentionedUsers = extractMentionedUsers(interaction.options.data);
  if (mentionedUsers.length) {
    await checkAfkMentions(mentionedUsers, interaction.channel, interaction.guild?.id);
  }

  await handleCommand(
    command,
    fromInteraction(interaction),
    `/${interaction.commandName}`,
    formatSlashInvocation(interaction),
  );
});

async function sendSlashOnlyNotice(message, command, client) {
  const name = command.data?.name || command.name;
  const mention = client.mentionCommand(name);

  const embed = new EmbedBuilder()
    .setTitle("🔒 Slash Command Only")
    .setDescription(
      [
        `\`${name}\` can't be run with a prefix - it depends on Discord features that only work through slash commands.`,
        "",
        `Please use ${mention} instead.`,
      ].join("\n"),
    )
    .setColor(0x5865f2)
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: "Not a bug - just a Discord API limitation" })
    .setTimestamp();

  try {
    await message.reply({ embeds: [embed] });
  } catch (err) {
    console.error("Failed to send slash-only notice:", err);
  }
}

async function sendMessagesOptOutNotice(message, client) {
  const embed = new EmbedBuilder()
    .setTitle("🔕 Prefix Commands Disabled")
    .setDescription(
      [
        "You've opted out of message content tracking, so your prefix commands are disabled.",
        `Slash commands still work, and so does mentioning me (\`@${client.user.username} <command>\`).`,
        `Run ${client.mentionCommand("settings opt-in-messages")} any time to turn this back on.`,
      ].join("\n"),
    )
    .setColor(0x5865f2)
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: "This respects your message opt-out preference" })
    .setTimestamp();

  try {
    await message.reply({ embeds: [embed] });
  } catch (err) {
    console.error("Failed to send messages-opt-out notice:", err);
  }
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  if (message.mentions.users.size > 0) {
    await checkAfkMentions([...message.mentions.users.values()], message.channel, message.guild.id);
  }

  const mentionMatch = message.content.match(new RegExp(`^<@!?${client.user.id}>`));
  if (mentionMatch) {
    const rest = message.content.slice(mentionMatch[0].length).trim();

    if (!rest) {
      const guildPrefix = (await client.db.get(`prefix_${message.guild.id}`)) || PREFIX;
      return message.channel.send(`My prefix for this server is \`${guildPrefix}\`.`);
    }

    message.mentions.users.delete(client.user.id);
    message.mentions.members?.delete(client.user.id);

    const args = rest.split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;
    if (command.allowPrefix === false) return sendSlashOnlyNotice(message, command, client);

    return handleCommand(
      command,
      fromMessage(message, args, command.optionOrder || []),
      `@${client.user.username} ${commandName}`,
      message.content,
    );
  }

  if (message.content.startsWith("eval")) {
    if (!owners.includes(message.author.id)) return;

    const args = message.content.split(" ").slice(1);
    const clean = (text) => {
      if (typeof text !== "string") text = require("util").inspect(text, { depth: 1 });
      return text
        .replace(/`/g, "`" + String.fromCharCode(8203))
        .replace(/@/g, "@" + String.fromCharCode(8203))
        .replaceAll(TOKEN, "[TOKEN]");
    };

    try {
      const code = args.join(" ");
      let evaled = eval(code);
      if (evaled instanceof Promise) evaled = await evaled;

      const output = clean(evaled);
      const chunk = output.length > 1900 ? output.slice(0, 1900) + "\n... (truncated)" : output;

      await message.channel.send(`\`\`\`xl\n${chunk}\n\`\`\``);
    } catch (err) {
      const output = clean(err);
      const chunk = output.length > 1900 ? output.slice(0, 1900) + "\n... (truncated)" : output;

      await message.channel.send(`\`ERROR\` \`\`\`xl\n${chunk}\n\`\`\``);
    }
    return;
  }

  const guildPrefix = (await client.db.get(`prefix_${message.guild.id}`)) || PREFIX;

  if (!message.content.startsWith(guildPrefix)) return;

  const args = message.content.slice(guildPrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;
  if (command.allowPrefix === false) return sendSlashOnlyNotice(message, command, client);

  const canonicalName = command.data?.name || command.name;
  if (!client.owners.includes(message.author.id) && canonicalName !== "settings") {
    const optedOut = (await client.db.get(`messagesoptout_${message.author.id}`)) === true;
    if (optedOut) return sendMessagesOptOutNotice(message, client);
  }

  await handleCommand(
    command,
    fromMessage(message, args, command.optionOrder || []),
    `${guildPrefix}${commandName}`,
    message.content,
  );
});

client.on(Events.GuildMemberAdd, async (member) => {
  const maintenance = await client.db.get("maintenance_");
  if (maintenance === true) return;
  if (await isGuildBlacklistActive(member.guild.id)) return;

  const isAutoroleEnabled = (await client.db.get("autorolestatus_" + member.guild.id)) === true;
  if (isAutoroleEnabled) {
    const autoroleRoleId = await client.db.get("roleautorole_" + member.guild.id);
    if (autoroleRoleId) {
      const isPremium = await isPremiumActive(
        `serverpremium_${member.guild.id}`,
        `serverpremiumtime_${member.guild.id}`,
      );
      if (isPremium) {
        try {
          await member.roles.add(autoroleRoleId);
        } catch (err) {
          console.error(`Failed to add autorole in ${member.guild.name}:`, err);
        }
      } else {
        await client.db.delete("autorolestatus_" + member.guild.id);
        await client.db.delete("roleautorole_" + member.guild.id);
      }
    }
  }

  const welcomeEnabled = (await client.db.get(`we_${member.guild.id}`)) === true;
  if (!welcomeEnabled) return;

  const welcomeSet = (await client.db.get(`ws_${member.guild.id}`)) === true;
  if (!welcomeSet) return;

  const channelId = await client.db.get(`wc_${member.guild.id}`);
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
    .setTitle("👋 Welcome!")
    .setDescription(`${member} just joined **${member.guild.name}**! Hope you enjoy your stay — don't forget to check the rules.`)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .addFields({ name: "Member Count", value: `${member.guild.memberCount}`, inline: true })
    .setColor(0x57f287)
    .setFooter({ text: `User ID: ${member.user.id}` })
    .setTimestamp();

  channel.send({ embeds: [embed] }).catch((err) => console.error("Failed to send welcome message:", err));
});

client.on(Events.GuildMemberRemove, async (member) => {
  const maintenance = await client.db.get("maintenance_");
  if (maintenance === true) return;
  if (await isGuildBlacklistActive(member.guild.id)) return;

  const leaveEnabled = (await client.db.get(`le_${member.guild.id}`)) === true;
  if (!leaveEnabled) return;

  const leaveSet = (await client.db.get(`ls_${member.guild.id}`)) === true;
  if (!leaveSet) return;

  const channelId = await client.db.get(`lc_${member.guild.id}`);
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);
  if (channel) {
    const embed = new EmbedBuilder()
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setTitle("👋 Member Left")
      .setDescription(`**${member.user.username}** just left **${member.guild.name}**. We hope to see you again someday.`)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields({ name: "Member Count", value: `${member.guild.memberCount}`, inline: true })
      .setColor(0xed4245)
      .setFooter({ text: `User ID: ${member.user.id}` })
      .setTimestamp();

    channel.send({ embeds: [embed] }).catch((err) => console.error("Failed to send leave message:", err));
  }

  await client.db.delete("captcha_pending_" + member.guild.id + "_" + member.user.id);
  await client.db.delete("captcha_verified_" + member.guild.id + "_" + member.user.id);
});

client.login(TOKEN);