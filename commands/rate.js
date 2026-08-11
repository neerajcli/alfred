const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const RATINGS = {
  gamer: {
    emoji: "🎮",
    title: "Gamer Rate",
    tiers: [
      { max: 19, color: 0x99aab5, lines: ["hasn't found the settings menu yet.", "is still on tutorial island."] },
      { max: 39, color: 0x5865f2, lines: ["plays casually, mostly for the vibes.", "logs on, vibes, logs off."] },
      { max: 59, color: 0xfee75c, lines: ["has decent game sense.", "carries their weight, respectably."] },
      { max: 79, color: 0xe67e22, lines: ["is one carry away from going pro.", "queues sweaty by default."] },
      { max: 100, color: 0x57f287, lines: ["eats, sleeps, and breathes the grind.", "has more hours in-game than awake."] },
    ],
  },
  rizz: {
    emoji: "💘",
    title: "Rizz Rate",
    tiers: [
      { max: 19, color: 0x99aab5, lines: ["'s rizz is currently in the shop for repairs.", "'s last text took 3 days to send."] },
      { max: 39, color: 0x5865f2, lines: ["has some rizz, but it's a W in progress.", "gets a maybe, occasionally."] },
      { max: 59, color: 0xfee75c, lines: ["can hold a conversation - respectable.", "has decent conversational footing."] },
      { max: 79, color: 0xe67e22, lines: ["has unspoken rizz. Dangerous levels.", "leaves people on read by choice."] },
      { max: 100, color: 0x57f287, lines: ["is a certified rizzler, no cap.", "could rizz up a brick wall."] },
    ],
  },
  sus: {
    emoji: "🔍",
    title: "Sus Meter",
    tiers: [
      { max: 19, color: 0x57f287, lines: ["is a confirmed crewmate.", "was doing wires the whole time."] },
      { max: 39, color: 0x5865f2, lines: ["has minor sus behavior — keep an eye out.", "took a weird route through electrical."] },
      { max: 59, color: 0xfee75c, lines: ["vented once, we all saw it.", "was suspiciously near the body."] },
      { max: 79, color: 0xe67e22, lines: ["is basically calling an emergency meeting on themselves.", "has no alibi and won't explain why."] },
      { max: 100, color: 0xed4245, lines: ["IS the impostor. Eject immediately.", "just sabotaged reactor for no reason."] },
    ],
  },
  chaos: {
    emoji: "🌪️",
    title: "Chaos Rate",
    tiers: [
      { max: 19, color: 0x57f287, lines: ["follows the rules like a saint.", "has never caused an incident."] },
      { max: 39, color: 0x5865f2, lines: ["causes mild, forgivable inconvenience.", "occasionally knocks things over."] },
      { max: 59, color: 0xfee75c, lines: ["thrives in mild chaos.", "is a small but consistent variable."] },
      { max: 79, color: 0xe67e22, lines: ["is a walking incident report.", "should be supervised at all times."] },
      { max: 100, color: 0xed4245, lines: ["should never be given admin permissions. Ever.", "is the reason we can't have nice things."] },
    ],
  },
  simp: {
    emoji: "🫡",
    title: "Simp Rate",
    tiers: [
      { max: 19, color: 0x99aab5, lines: ["has an iron heart, unbothered.", "does not simp. Period."] },
      { max: 39, color: 0x5865f2, lines: ["simps occasionally, no shame.", "has one weakness, and it's minor."] },
      { max: 59, color: 0xfee75c, lines: ["would drop everything for one text back.", "checks their phone a little too often."] },
      { max: 79, color: 0xe67e22, lines: ["is on thin ice with their wallet.", "has simped in public, unashamed."] },
      { max: 100, color: 0xed4245, lines: ["would build a civilization for one 'hi'.", "simps so hard it's basically a personality trait."] },
    ],
  },
  clown: {
    emoji: "🤡",
    title: "Clown Rate",
    tiers: [
      { max: 19, color: 0x57f287, lines: ["is surprisingly composed today.", "hasn't clowned once, shockingly."] },
      { max: 39, color: 0x5865f2, lines: ["pulled one clown move recently.", "tripped over nothing, once."] },
      { max: 59, color: 0xfee75c, lines: ["is part of the circus crew.", "juggles responsibilities. Badly."] },
      { max: 79, color: 0xe67e22, lines: ["should have their own tent.", "is one bad decision from a red nose."] },
      { max: 100, color: 0xed4245, lines: ["is the circus.", "graduated clown college with honors."] },
    ],
  },
  sigma: {
    emoji: "🗿",
    title: "Sigma Rate",
    tiers: [
      { max: 19, color: 0x99aab5, lines: ["is still figuring out the grindset.", "hasn't unlocked sigma mode yet."] },
      { max: 39, color: 0x5865f2, lines: ["has sigma potential, untapped.", "occasionally moves in silence."] },
      { max: 59, color: 0xfee75c, lines: ["walks their own path, sort of.", "is aware of the grindset, at least."] },
      { max: 79, color: 0xe67e22, lines: ["moves in silence. Respect only.", "doesn't do small talk. Or eye contact."] },
      { max: 100, color: 0x57f287, lines: ["doesn't do mornings - mornings do them.", "is the grindset. No further questions."] },
    ],
  },
};

const AURA_TIERS = [
  { max: -501, color: 0xed4245, lines: ["is in full aura bankruptcy. Seek professional help.", "owes the aura bank an apology and then some."] },
  { max: -1, color: 0xe67e22, lines: ["is running an aura deficit today.", "has negative aura. It happens to the best of us."] },
  { max: 0, color: 0x99aab5, lines: ["'s aura is exactly zero. Suspiciously neutral.", "'s aura is... perfectly balanced. Unsettling."] },
  { max: 500, color: 0x5865f2, lines: ["has some solid positive aura building.", "is quietly accumulating aura points."] },
  { max: 1000, color: 0xf1c40f, lines: ["is radiating unmatched aura.", "is aura royalty. Bow."] },
];

function pickTier(tiers, value) {
  return tiers.find((tier) => value <= tier.max) ?? tiers[tiers.length - 1];
}

function pickLine(tier) {
  return tier.lines[Math.floor(Math.random() * tier.lines.length)];
}

module.exports = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("rate")
    .setDescription("Get a completely unscientific rating for yourself or someone else.")
    .addSubcommand((sub) =>
      sub
        .setName("gamer")
        .setDescription("Rate someone's gamer level")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to rate (defaults to you)").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("rizz")
        .setDescription("Rate someone's rizz")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to rate (defaults to you)").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("sus")
        .setDescription("Rate how sus someone is")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to rate (defaults to you)").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("chaos")
        .setDescription("Rate someone's chaos energy")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to rate (defaults to you)").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("simp")
        .setDescription("Rate someone's simp level")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to rate (defaults to you)").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("clown")
        .setDescription("Rate someone's clown level")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to rate (defaults to you)").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("sigma")
        .setDescription("Rate someone's sigma grindset")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to rate (defaults to you)").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("aura")
        .setDescription("Check someone's aura points (-1000 to 1000)")
        .addUserOption((opt) => opt.setName("user").setDescription("Who to check (defaults to you)").setRequired(false)),
    ),

  allowPrefix: true,
  optionOrder: ["_subcommand", "user"],

  async execute(ctx, client) {
    const sub = ctx.getSubcommand();
    const target = ctx.getUser("user") || ctx.user;

    if (sub === "aura") {
      const value = Math.floor(Math.random() * 2001) - 1000;
      const tier = pickTier(AURA_TIERS, value);
      const line = pickLine(tier);
      const displayValue = value > 0 ? `+${value}` : `${value}`;

      const embed = new EmbedBuilder()
        .setTitle("✨ Aura Check")
        .setDescription(`**${target}** ${line}`)
        .addFields({ name: "Aura", value: `${displayValue} points`, inline: true })
        .setThumbnail(target.displayAvatarURL())
        .setColor(tier.color)
        .setFooter({ text: "Not scientifically validated. Please don't take this seriously 😄" })
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    }

    const rating = RATINGS[sub];
    if (!rating) return ctx.reply("Usage: `/rate <gamer|rizz|sus|chaos|simp|clown|sigma|aura> [user]`");

    const value = Math.round(Math.random() * 100);
    const tier = pickTier(rating.tiers, value);
    const line = pickLine(tier);

    const embed = new EmbedBuilder()
      .setTitle(`${rating.emoji} ${rating.title}`)
      .setDescription(`**${target}** ${line}`)
      .addFields({ name: "Score", value: `${value}%`, inline: true })
      .setThumbnail(target.displayAvatarURL())
      .setColor(tier.color)
      .setFooter({ text: "Not scientifically validated. Please don't take this seriously 😄" })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  },
};