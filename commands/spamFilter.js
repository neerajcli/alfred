const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { getConfig, setConfig } = require("../utils/spamStore");
const { parseDurationSpec, humanizeDuration } = require("../utils/time");

const ACTION_CHOICES = [
    { name: "Warn only", value: "warn" },
    { name: "Delete duplicates", value: "delete" },
    { name: "Timeout user", value: "timeout" },
    { name: "Delete + timeout", value: "delete_timeout" },
];
const VALID_ACTIONS = ACTION_CHOICES.map((c) => c.value);

function parseTimeoutMs(input) {
    const spec = parseDurationSpec(input);
    if (!spec || spec.type !== "duration") return null;
    return spec.ms;
}

function settingsEmbed(config) {
    return new EmbedBuilder()
        .setTitle("🛡️ Spam Detection Settings")
        .addFields(
            { name: "Status", value: config.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
            { name: "Threshold", value: `${config.threshold} repeats`, inline: true },
            { name: "Window", value: `${Math.round(config.windowMs / 1000)}s`, inline: true },
            { name: "Action", value: config.action, inline: true },
            { name: "Timeout Duration", value: humanizeDuration(config.timeoutMs), inline: true },
        )
        .setColor(config.enabled ? 0x57f287 : 0xed4245);
}

function usageEmbed() {
    return new EmbedBuilder()
        .setTitle("🛡️ Spam Filter — Usage")
        .setDescription(
            [
                "`spamfilter on` — enable spam detection",
                "`spamfilter off` — disable spam detection",
                "`spamfilter status` — show current settings",
                "`spamfilter config threshold:<n> window:<seconds> action:<warn|delete|timeout|delete_timeout> duration:<e.g. 5m>`",
            ].join("\n"),
        )
        .setColor(0x5865f2);
}

function parseConfigTokens(text) {
    const patch = {};
    const tokens = text.trim().split(/\s+/).filter(Boolean);

    for (const token of tokens) {
        const [key, value] = token.split(":");
        if (!key || value === undefined) continue;
        patch[key.toLowerCase()] = value;
    }
    return patch;
}

module.exports = {
    category: "Moderation",
    data: new SlashCommandBuilder()
        .setName("spamfilter")
        .setDescription("Configure duplicate-message spam detection.")
        .addSubcommand((sub) => sub.setName("on").setDescription("Enable spam detection"))
        .addSubcommand((sub) => sub.setName("off").setDescription("Disable spam detection"))
        .addSubcommand((sub) => sub.setName("status").setDescription("Show current settings"))
        .addSubcommand((sub) =>
            sub
                .setName("config")
                .setDescription("Update spam detection settings")
                .addIntegerOption((opt) =>
                    opt.setName("threshold").setDescription("Repeats before triggering").setMinValue(2).setMaxValue(20),
                )
                .addIntegerOption((opt) =>
                    opt.setName("window").setDescription("Window in seconds").setMinValue(3).setMaxValue(300),
                )
                .addStringOption((opt) =>
                    opt.setName("action").setDescription("What to do when triggered").addChoices(...ACTION_CHOICES),
                )
                .addStringOption((opt) =>
                    opt.setName("duration").setDescription("Timeout duration, e.g. 5m, 1h (only used for timeout actions)"),
                ),
        ),

    allowPrefix: true,

    async execute(ctx, client) {
        const db = client.db;
        const sub = ctx.getSubcommand();

        if (!sub || !["on", "off", "status", "config"].includes(sub)) {
            return ctx.reply({ embeds: [usageEmbed()] });
        }

        if (sub === "status") {
            const config = await getConfig(db, ctx.guild.id);
            return ctx.reply({ embeds: [settingsEmbed(config)] });
        }

        if (!ctx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return ctx.reply("You need the **Manage Server** permission to do that.");
        }

        if (sub === "on") {
            const config = await setConfig(db, ctx.guild.id, { enabled: true });
            return ctx.reply({ content: "✅ Spam detection enabled.", embeds: [settingsEmbed(config)] });
        }

        if (sub === "off") {
            const config = await setConfig(db, ctx.guild.id, { enabled: false });
            return ctx.reply({ content: "❌ Spam detection disabled.", embeds: [settingsEmbed(config)] });
        }

        if (sub === "config") {
            const patch = {};

            const thresholdRaw = ctx.source === "slash" ? ctx.raw.options.getInteger("threshold") : null;
            const windowRaw = ctx.source === "slash" ? ctx.raw.options.getInteger("window") : null;
            const actionRaw = ctx.source === "slash" ? ctx.raw.options.getString("action") : null;
            const durationRaw = ctx.source === "slash" ? ctx.raw.options.getString("duration") : null;

            if (ctx.source === "slash") {
                if (thresholdRaw != null) patch.threshold = thresholdRaw;
                if (windowRaw != null) patch.windowMs = windowRaw * 1000;
                if (actionRaw != null) patch.action = actionRaw;
                if (durationRaw != null) {
                    const ms = parseTimeoutMs(durationRaw);
                    if (ms == null) return ctx.reply("Couldn't parse that duration. Try something like `5m` or `1h`.");
                    patch.timeoutMs = ms;
                }
            } else {
                const tokens = parseConfigTokens(ctx.restText || "");

                if (tokens.threshold != null) {
                    const n = parseInt(tokens.threshold, 10);
                    if (Number.isNaN(n) || n < 2 || n > 20) return ctx.reply("`threshold` must be a number between 2 and 20.");
                    patch.threshold = n;
                }
                if (tokens.window != null) {
                    const n = parseInt(tokens.window, 10);
                    if (Number.isNaN(n) || n < 3 || n > 300) return ctx.reply("`window` must be a number of seconds between 3 and 300.");
                    patch.windowMs = n * 1000;
                }
                if (tokens.action != null) {
                    if (!VALID_ACTIONS.includes(tokens.action)) {
                        return ctx.reply(`\`action\` must be one of: ${VALID_ACTIONS.join(", ")}`);
                    }
                    patch.action = tokens.action;
                }
                if (tokens.duration != null) {
                    const ms = parseTimeoutMs(tokens.duration);
                    if (ms == null) return ctx.reply("Couldn't parse `duration`. Try something like `duration:5m`.");
                    patch.timeoutMs = ms;
                }
            }

            if (Object.keys(patch).length === 0) {
                return ctx.reply({ embeds: [usageEmbed()] });
            }

            const config = await setConfig(db, ctx.guild.id, patch);
            return ctx.reply({ content: "✅ Settings updated.", embeds: [settingsEmbed(config)] });
        }
    },
};