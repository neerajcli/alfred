const { SlashCommandBuilder } = require("discord.js");

const DISABLED_GUILDS = ["735615909884067930"];
const MAX_LENGTH = 2000;

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make the bot say anything you want.")
    .addStringOption((opt) => opt.setName("message").setDescription("What should I say?").setRequired(true)),

  allowPrefix: true,

  async execute(ctx, client) {
    if (DISABLED_GUILDS.includes(ctx.guild?.id)) {
      return ctx.reply("This command is disabled in this server.");
    }

    const toSay = (ctx.source === "slash" ? ctx.getString("message") : ctx.fullText)?.trim();

    if (!toSay) return ctx.reply("Please provide something to say!");
    if (toSay.length > MAX_LENGTH) {
      return ctx.reply(`That's too long - please keep it under ${MAX_LENGTH} characters.`);
    }

    const payload = { content: toSay, allowedMentions: { parse: [] } };

    if (ctx.source === "slash") {
      return ctx.reply(payload);
    }

    await ctx.channel.send(payload);
    try {
      await ctx.raw.delete();
    } catch {
    }
  },
};