const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");

const CHOICES = ["rock", "paper", "scissors"];
const EMOJI = { rock: "🪨", paper: "📄", scissors: "✂️" };
const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildChoiceRow(userId) {
  return new ActionRowBuilder().addComponents(
    ...CHOICES.map((choice) =>
      new ButtonBuilder()
        .setCustomId(`rps:pick:${userId}:${choice}`)
        .setLabel(capitalize(choice))
        .setEmoji(EMOJI[choice])
        .setStyle(ButtonStyle.Secondary),
    ),
  );
}

function buildResultEmbed(user, myChoice, botChoice, resultText, color, record) {
  return new EmbedBuilder()
    .setTitle("🪨 📄 ✂️ Rock Paper Scissors")
    .addFields(
      { name: "Your Choice", value: `${EMOJI[myChoice]} ${capitalize(myChoice)}`, inline: true },
      { name: "My Choice", value: `${EMOJI[botChoice]} ${capitalize(botChoice)}`, inline: true },
    )
    .setDescription(resultText)
    .setColor(color)
    .setFooter({ text: `${user.tag}'s record: ${record.wins}W • ${record.losses}L • ${record.ties}T` })
    .setTimestamp();
}

async function playRound(db, userId, myChoice) {
  const botChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];

  let outcome;
  let resultText;
  let color;
  if (myChoice === botChoice) {
    outcome = "ties";
    resultText = "🤝 It's a tie! Wanna go again?";
    color = 0xfee75c;
  } else if (BEATS[myChoice] === botChoice) {
    outcome = "wins";
    resultText = "🎉 You won! Well played.";
    color = 0x57f287;
  } else {
    outcome = "losses";
    resultText = "💀 I won this time! Better luck next round.";
    color = 0xed4245;
  }

  const key = `rpsrecord_${userId}`;
  const record = (await db.get(key)) || { wins: 0, losses: 0, ties: 0 };
  record[outcome]++;
  await db.set(key, record);

  return { botChoice, resultText, color, record };
}

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Play rock, paper, scissors against the bot.")
    .addStringOption((opt) =>
      opt
        .setName("choice")
        .setDescription("Your move (leave blank to pick with buttons instead)")
        .setRequired(false)
        .addChoices(
          { name: "Rock", value: "rock" },
          { name: "Paper", value: "paper" },
          { name: "Scissors", value: "scissors" },
        ),
    ),

  allowPrefix: true,
  optionOrder: ["choice"],

  async execute(ctx, client) {
    const typedChoice = ctx.getString("choice")?.toLowerCase();

    if (typedChoice) {
      if (!CHOICES.includes(typedChoice)) {
        return ctx.reply("Please choose rock, paper, or scissors.");
      }

      const { botChoice, resultText, color, record } = await playRound(client.db, ctx.user.id, typedChoice);
      const embed = buildResultEmbed(ctx.user, typedChoice, botChoice, resultText, color, record);
      return ctx.reply({ embeds: [embed] });
    }

    const promptEmbed = new EmbedBuilder()
      .setTitle("🪨 📄 ✂️ Rock Paper Scissors")
      .setDescription(`${ctx.user}, pick your move!`)
      .setColor(0x5865f2)
      .setTimestamp();

    return ctx.reply({ embeds: [promptEmbed], components: [buildChoiceRow(ctx.user.id)] });
  },

  async handleButton(interaction, client) {
    const [, action, userId, move] = interaction.customId.split(":");
    if (action !== "pick") return;

    if (interaction.user.id !== userId) {
      return interaction.reply({ content: "This isn't your game - run `/rps` to start your own!", flags: MessageFlags.Ephemeral });
    }

    const { botChoice, resultText, color, record } = await playRound(client.db, userId, move);
    const embed = buildResultEmbed(interaction.user, move, botChoice, resultText, color, record);

    return interaction.update({ embeds: [embed], components: [] });
  },
};