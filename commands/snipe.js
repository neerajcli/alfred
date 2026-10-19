const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { getLastDeleted } = require("../features/snipe");

module.exports = {
    category: "Moderation",
    data: new SlashCommandBuilder()
        .setName("snipe")
        .setDescription("Show the last deleted message in this channel."),

    allowPrefix: true,

    async execute(ctx, client) {
        if (!ctx.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return ctx.reply("You need the **Manage Messages** permission to do that.");
        }

        const entry = getLastDeleted(ctx.channel.id);
        if (!entry) {
            return ctx.reply("There's nothing to snipe in this channel.");
        }

        const embed = new EmbedBuilder()
            .setAuthor({
                name: entry.authorTag,
                iconURL: entry.authorAvatarURL || undefined,
            })
            .setDescription(entry.content || "*No text content*")
            .setColor(0xed4245)
            .setFooter({ text: `Deleted` })
            .setTimestamp(entry.deletedAt);

        if (entry.attachmentUrls.length > 0) {
            embed.addFields({ name: "Attachments", value: entry.attachmentUrls.join("\n") });
            const firstImage = entry.attachmentUrls.find((url) => /\.(png|jpe?g|gif|webp)$/i.test(url));
            if (firstImage) embed.setImage(firstImage);
        }

        return ctx.reply({ embeds: [embed] });
    },
};