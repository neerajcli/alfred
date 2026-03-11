const Discord = require('discord.js') 
const { QuickDB } = require("quick.db")
const db = new QuickDB();
const ms = require("parse-ms")
module.exports = {
    name: "beg",
    category: "Economy",
    description: "Do some begging and get the money",
    execute: async (client, message, args) => {
        if(message.author.bot) return; 
        let timeout = 10800000; 
        let work = await db.get(`beg_${message.author.id}`);
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
        let money1 = Math.round(Math.random() * 200)
        await db.set('money_' + message.author.id, money1)
        let money = await db.get(`money_${message.author.id}`)
        await db.add(`cash_${message.author.id}`, money)
       const embed = new Discord.MessageEmbed()
        .setTitle("Beg")
        .setDescription('You begged the founder and earned $' + money)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed) 
        await db.set(`beg_${message.author.id}`, Date.now())
  }
       
         }
}