const Discord = require('discord.js') 
const { QuickDB } = require("quick.db")
const db = new QuickDB();
const ms = require("parse-ms")
module.exports = {
    name: "work",
    category: "Economy",
    description: "Do some work and get the money",
    execute: async (client, message, args) => {
        if(message.author.bot) return; 
        const authorpass = await db.get('econpass_' + message.author.id);
        if(authorpass == null) return message.channel.send("Please create your bank password using `+reset-pass` to use this command");
        let timeout = 10800000; 
        let work = await db.get(`work_${message.author.id}`);
if (work !== null && timeout - (Date.now() - work) > 0) {
    let time = ms(timeout - (Date.now() - work));
  let timeEmbed = new Discord.MessageEmbed()
    .setColor("#FFFFFF") 
    .setTitle("Cooldown")
    .setDescription(`You need to wait ${time.hours}h ${time.minutes}m ${time.seconds}s to use this command again.`);
    message.channel.send(timeEmbed)
  } else {
 let ws = await db.get(`cash_${message.author.id}`)
if (ws = null) await db.set('cash_' + message.author.id, 0);
        let money1 = Math.round(Math.random() * 300)
        await db.set('money_' + message.author.id, money1)
        let money = await db.get(`money_${message.author.id}`)
        await db.add(`cash_${message.author.id}`, money)
        const embed = new Discord.MessageEmbed()
        .setTitle("Work")
        .setDescription('You worked in a company and earned $' + money)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed) 
        await db.set(`work_${message.author.id}`, Date.now())
  }
       
         }
}