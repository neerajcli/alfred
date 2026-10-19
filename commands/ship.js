const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

function loveTier(percent) {
  if (percent === 100) return { emoji: "💯", text: "Soulmates! This is destiny.", color: 0xffd700 };
  if (percent >= 80) return { emoji: "💖", text: "A match made in heaven!", color: 0xed4245 };
  if (percent >= 60) return { emoji: "💗", text: "There's definitely something here.", color: 0xff69b4 };
  if (percent >= 40) return { emoji: "🧡", text: "Could go either way, honestly.", color: 0xffa500 };
  if (percent >= 20) return { emoji: "💛", text: "Just friends... probably.", color: 0xfee75c };
  return { emoji: "💔", text: "Yeah, this one's not happening.", color: 0x99aab5 };
}

function loveBar(percent) {
  const filled = Math.round(percent / 10);
  return "❤️".repeat(filled) + "🤍".repeat(10 - filled);
}

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("ship")
    .setDescription("Check how much you love someone!")
    .addUserOption((opt) => opt.setName("user").setDescription("Who do you want to ship with?").setRequired(true)),

  allowPrefix: true,
  optionOrder: ["user"],

  async execute(ctx, client) {
    const target = ctx.getUser("user");
    if (!target) return ctx.reply("Please mention someone to ship with!");

    if (target.id === ctx.user.id) {
      const selfEmbed = new EmbedBuilder()
        .setTitle("💘 Love Calculator")
        .setDescription(`❤️ **${ctx.user.username}** loves themselves **101%**! ❤️\nSelf-love is important. 💕`)
        .setThumbnail(ctx.user.displayAvatarURL())
        .setColor(0xffd700)
        .setTimestamp();
      return ctx.reply({ embeds: [selfEmbed] });
    }

    const percent = Math.floor(Math.random() * 101);
    const tier = loveTier(percent);

    const embed = new EmbedBuilder()
      .setTitle("💘 Love Calculator")
      .setAuthor({ name: ctx.user.username, iconURL: ctx.user.displayAvatarURL() })
      .setDescription(
        [
          `**${ctx.user.username}** ❤️ **${target.username}**`,
          "",
          `${loveBar(percent)}  **${percent}%**`,
          "",
          `${tier.emoji} ${tier.text}`,
        ].join("\n"),
      )
      .setThumbnail(target.displayAvatarURL())
      .setColor(tier.color)
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};