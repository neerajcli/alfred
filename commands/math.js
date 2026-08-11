const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const math = require("mathjs");

const MAX_INPUT_LENGTH = 200;
const MAX_FIELD_LENGTH = 1000;

module.exports = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("math")
    .setDescription("Evaluate a math expression.")
    .addStringOption((opt) => opt.setName("equation").setDescription("The expression to evaluate").setRequired(true)),

  allowPrefix: true,
  optionOrder: ["equation"],

  async execute(ctx, client) {
    const equation = (ctx.source === "slash" ? ctx.getString("equation") : ctx.fullText)?.trim();
    if (!equation) return ctx.reply("Please provide an equation to evaluate.");

    if (equation.length > MAX_INPUT_LENGTH) {
      return ctx.reply(`That expression is too long - keep it under ${MAX_INPUT_LENGTH} characters.`);
    }

    let result;
    try {
      result = math.evaluate(equation);
    } catch {
      return ctx.reply("Please enter a valid equation!");
    }

    const output = String(result).slice(0, MAX_FIELD_LENGTH);
    const input = equation.slice(0, MAX_FIELD_LENGTH);

    const embed = new EmbedBuilder()
      .setTitle("🧮 Result")
      .addFields(
        { name: "Input", value: `\`\`\`js\n${input}\`\`\`` },
        { name: "Output", value: `\`\`\`js\n${output}\`\`\`` },
      )
      .setColor(0x57f287)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};