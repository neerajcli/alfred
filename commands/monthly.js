module.exports = {
  name: "monthly",
  category: "User Premium",
  description: "Get some money every 30 days.",
  execute: async (client, message, args) => {
    const ms = require("parse-ms")
    const db = client.db;
    const Discord = client.discord;
    if (message.author.bot) return;
    const authorpass = await db.get('econpass_' + message.author.id);
    if (authorpass == null) return message.channel.send("Please create your bank password using `a!reset-pass` to use this command");
    let isPremium = await db.get('userpremium_' + message.author.id)
    if (isPremium !== true) return message.channel.send('Only premium members can use this command.')
    let timeout = 2592000000
    let monthly = await db.get(`monthly_${message.author.id}`);
    if (monthly !== null && timeout - (Date.now() - monthly) > 0) {
      let time = ms(timeout - (Date.now() - monthly));
      let timeEmbed = new Discord.MessageEmbed()
        .setColor("#FFFFFF")
        .setTitle("Cooldown")
        .setDescription(`You need to wait ${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s to use this command again.`);
      message.channel.send(timeEmbed)
    } else {
      let money1 = Math.round(Math.random() * 50000)
      await db.set('moneymonthly_' + message.author.id, money1)
      let money = await db.get(`moneymonthly_${message.author.id}`)
      const embed1 = new Discord.MessageEmbed()
        .setTitle('Monthly Claim')
        .setColor('#FFFFFF')
        .setTimestamp()
        .setDescription('You got $' + money + ' from your monthly reward. Use the command after 30 days to claim this again!')
      message.channel.send(embed1)
      await db.add('cash_' + message.author.id, money)
      await db.set('monthly_' + message.author.id, Date.now())
    }
  }
}