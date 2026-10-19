const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const {
    getResponders,
    addResponder,
    removeResponder,
} = require("../utils/autoresponderStore");

const MAX_TRIGGER_LEN = 100;
const MAX_REPLY_LEN = 500;
const MAX_PER_GUILD = 10;

const TYPE_CHOICES = [
    { name: "Includes (default)", value: "includes" },
    { name: "Exact match", value: "exact" },
    { name: "Regex", value: "regex" },
];
const VALID_TYPES = TYPE_CHOICES.map((c) => c.value);

function parseTrigger(raw) {
    const match = raw.match(/^(exact|regex):(.+)$/s);
    if (match) return { matchType: match[1], trigger: match[2].trim() };
    return { matchType: "includes", trigger: raw.trim() };
}

function usageEmbed() {
    return new EmbedBuilder()
        .setTitle("🤖 Autoresponder — Usage")
        .setDescription(
            [
                "`autoresponder add <trigger> | <reply>` — add a new autoresponder",
                "`autoresponder add exact:<trigger> | <reply>` — only fires on an exact message match",
                "`autoresponder add regex:<pattern> | <reply>` — fires when the message matches a regex",
                "`autoresponder remove <trigger>` — remove one by its exact trigger text",
                "`autoresponder list` — show all configured autoresponders",
            ].join("\n"),
        )
        .setColor(0x5865f2);
}

function validateTrigger(matchType, trigger, reply) {
    if (!trigger || !reply) return "Both a trigger and a reply are required.";
    if (trigger.length > MAX_TRIGGER_LEN) return `Trigger is too long (max ${MAX_TRIGGER_LEN} characters).`;
    if (reply.length > MAX_REPLY_LEN) return `Reply is too long (max ${MAX_REPLY_LEN} characters).`;
    if (matchType === "regex") {
        try {
            new RegExp(trigger);
        } catch {
            return "That regex pattern is invalid.";
        }
    }
    return null;
}

module.exports = {
    category: "Utility",
    data: new SlashCommandBuilder()
        .setName("autoresponder")
        .setDescription("Set up autoresponders for your server.")
        .addSubcommand((sub) =>
            sub
                .setName("add")
                .setDescription("Add a new autoresponder")
                .addStringOption((opt) => opt.setName("trigger").setDescription("Text or pattern to match").setRequired(true))
                .addStringOption((opt) => opt.setName("reply").setDescription("Reply to send").setRequired(true))
                .addStringOption((opt) =>
                    opt.setName("type").setDescription("How the trigger is matched (default: includes)").addChoices(...TYPE_CHOICES),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName("remove")
                .setDescription("Remove an autoresponder by its exact trigger text")
                .addStringOption((opt) => opt.setName("trigger").setDescription("The exact trigger to remove").setRequired(true)),
        )
        .addSubcommand((sub) => sub.setName("list").setDescription("Show all configured autoresponders")),

    allowPrefix: true,

    async execute(ctx, client) {
        const sub = ctx.getSubcommand();

        if (!sub || !["add", "remove", "list"].includes(sub)) {
            return ctx.reply({ embeds: [usageEmbed()] });
        }

        if (sub === "list") {
            const entries = await getResponders(client.db, ctx.guild.id);
            if (entries.length === 0) {
                return ctx.reply("No autoresponders are set up in this server yet.");
            }

            const embed = new EmbedBuilder()
                .setTitle("🤖 Autoresponders")
                .setDescription(
                    entries
                        .map((e, i) => `**${i + 1}.** \`${e.matchType}\` — \`${e.trigger}\` → ${e.reply}`)
                        .join("\n")
                        .slice(0, 4000),
                )
                .setColor(0x5865f2)
                .setFooter({ text: `${entries.length}/${MAX_PER_GUILD} used` });

            return ctx.reply({ embeds: [embed] });
        }

        if (!ctx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return ctx.reply("You need the **Manage Server** permission to do that.");
        }

        if (sub === "add") {
            let trigger, reply, matchType;

            if (ctx.source === "slash") {
                trigger = (ctx.getString("trigger") || "").trim();
                reply = (ctx.getString("reply") || "").trim();
                matchType = ctx.getString("type") || "includes";
                if (!VALID_TYPES.includes(matchType)) matchType = "includes";
            } else {
                const body = ctx.restText;
                if (!body || !body.includes("|")) {
                    return ctx.reply({
                        content: "Missing a reply. Use: `autoresponder add <trigger> | <reply>`",
                        embeds: [usageEmbed()],
                    });
                }

                const [rawTrigger, ...replyParts] = body.split("|");
                reply = replyParts.join("|").trim();
                ({ matchType, trigger } = parseTrigger(rawTrigger.trim()));
            }

            const error = validateTrigger(matchType, trigger, reply);
            if (error) return ctx.reply(error);

            const existing = await getResponders(client.db, ctx.guild.id);
            if (existing.length >= MAX_PER_GUILD) {
                return ctx.reply(`This server already has the max of ${MAX_PER_GUILD} autoresponders.`);
            }

            const added = await addResponder(client.db, ctx.guild.id, trigger, reply, matchType);
            if (!added) {
                return ctx.reply("An autoresponder with that exact trigger already exists.");
            }

            const embed = new EmbedBuilder()
                .setTitle("✅ Autoresponder Added")
                .addFields(
                    { name: "Type", value: matchType, inline: true },
                    { name: "Trigger", value: `\`${trigger}\``, inline: true },
                    { name: "Reply", value: reply, inline: false },
                )
                .setColor(0x57f287);

            return ctx.reply({ embeds: [embed] });
        }

        if (sub === "remove") {
            const trigger = ctx.source === "slash" ? (ctx.getString("trigger") || "").trim() : ctx.restText?.trim();
            if (!trigger) {
                return ctx.reply("Usage: `autoresponder remove <trigger>`");
            }

            const removed = await removeResponder(client.db, ctx.guild.id, trigger);
            if (!removed) {
                return ctx.reply(`No autoresponder found with the trigger \`${trigger}\`. Check \`autoresponder list\`.`);
            }

            return ctx.reply(`🗑️ Removed the autoresponder for \`${trigger}\`.`);
        }
    },
};