const Discord = require('discord.js') 
const { QuickDB } = require("quick.db")
const db = new QuickDB();
const ms = require("parse-ms")
module.exports = {
    name: "crime",
    category: "Economy",
    description: "Do some crime and get the money",
    execute: async (client, message, args) => { 
let chance = Math.random(Math.round() *10)
        if(message.author.bot) return; 
        const authorpass = await db.get('econpass_' + message.author.id);
        if(authorpass == null) return message.channel.send("Please create your bank password using `+reset-pass` to use this command");
        let timeout = 10800000; 
        let work = await db.get(`crime_${message.author.id}`);
if (work !== null && timeout - (Date.now() - work) > 0) {
    let time = ms(timeout - (Date.now() - work));
  let timeEmbed = new Discord.MessageEmbed()
    .setColor("#FFFFFF") 
    .setTitle("Cooldown")
    .setDescription(`You need to wait ${time.hours}h ${time.minutes}m ${time.seconds}s to use this command again.`);
    message.channel.send(timeEmbed)
  } else {
 let ws1 = await db.get(`cash_${message.author.id}`)
if (ws1 === null) await db.set('cash_' + message.author.id, 0); 
let ws = await db.get(`cash_${message.author.id}`)
if (chance <= 6) {
        let money1 = Math.round(Math.random() * 200)
        await db.set('money_' + message.author.id, money1)
        let money = await db.get(`money_${message.author.id}`)
        await db.add(`cash_${message.author.id}`, money)
       const embed = new Discord.MessageEmbed()
        .setTitle("Crime")
        .setDescription('You broke into a shop and stole $' + money)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed) 
} else { 
    let wb = await db.get(`bank_${message.author.id}`)
    if (wb === null) await db.set('bank_' + message.author.id, 0)
if (ws === 0 && wb !==0) {
let loss = Math.round(Math.random() * wb)
} else if (ws !==0) {
let loss = Math.round(Math.random() * ws) } else {
let loss = Math.round(Math.random() * 100)
}
if(loss > 3000) loss = 3000;
await db.set('loss_' + message.author.id, loss)
const money11 = await db.get(`loss_${message.author.id}`)
await db.sub(`cash_${message.author.id}`, money11)
const embed1 = new Discord.MessageEmbed()
        .setTitle("Crime")
        .setDescription('You broke in a shop but were caught and were fined $' + money11)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed) 
}
        await db.set(`crime_${message.author.id}`, Date.now())
  }
       
         }
}