module.exports = {
  name: "daily",
  category: "Economy",
  description: "Get some money by voting for the bot every 12 hours.",
  execute: async (client, message, args) => {
    const DBL = require("dblapi.js");
    const ms = require("parse-ms")
    const db = client.db;
    const Discord = client.discord;
    if (message.author.bot) return;
    const authorpass = await db.get('econpass_' + message.author.id);
    if (authorpass == null) return message.channel.send("Please create your bank password using `a!reset-pass` to use this command");
    const dbl = new DBL('DBL API KEY HERE', client);
    dbl.hasVoted(message.author.id).then(async voted => {
      if (voted) {
        let timeout = 43200000
        let daily = await db.get(`daily_${message.author.id}`);
        if (daily !== null && timeout - (Date.now() - daily) > 0) {
          let time = ms(timeout - (Date.now() - daily));
          let timeEmbed = new Discord.MessageEmbed()
            .setColor("#FFFFFF")
            .setTitle("Cooldown")
            .setDescription(`You need to wait ${time.hours}h ${time.minutes}m ${time.seconds}s to use this command again.`);
          message.channel.send(timeEmbed)
        } else {
          let money1 = Math.round(Math.random() * 500)
          await db.set('moneydaily_' + message.author.id, money1)
          let money = await db.get(`moneydaily_${message.author.id}`)
          const embed1 = new Discord.MessageEmbed()
            .setTitle('Daily Claim')
            .setColor('#FFFFFF')
            .setTimestamp()
            .setDescription('You got $' + money + ' from your daily reward. Vote after 12 hours to claim this again!')
          message.channel.send(embed1)
          await db.add('cash_' + message.author.id, money)
          await db.set('daily_' + message.author.id, Date.now())
        }
      } else {
        const embed = new Discord.MessageEmbed()
          .addField("Voting Rewards", `You haven't voted today, **[click here](https://top.gg/bot/670234327749099521/vote)** to vote and try again!`)
          .setColor("#FFFFFF")
          .setFooter("If it doesn't work after voting, please wait 5-10 minutes and then try again!")
        message.channel.send(embed)
      }
    })
  }

}