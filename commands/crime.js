const Discord = require('discord.js') 
const db = require('quick.db') 
const ms = require("parse-ms")
module.exports = {
    name: "crime",
    category: "Economy",
    description: "Do some crime and get the money",
    execute: async (client, message, args) => { 
let chance = Math.random(Math.round() *10)
        if(message.author.bot) return; 
        let timeout = 10800000; 
        let work = await db.fetch(`crime_${message.author.id}`);
if (work !== null && timeout - (Date.now() - work) > 0) {
    let time = ms(timeout - (Date.now() - work));
  let timeEmbed = new Discord.MessageEmbed()
    .setColor("#FFFFFF") 
    .setTitle("Cooldown")
    .setDescription(`You need to wait ${time.hours}h ${time.minutes}m ${time.seconds}s to use this command again.`);
    message.channel.send(timeEmbed)
  } else {
 let ws1 = await db.fetch(`cash_${message.author.id}`)
if (ws1 === null) db.set('cash_' + message.author.id, 0); 
let ws = await db.fetch(`cash_${message.author.id}`)
if (chance <= 6) {
        let money1 = Math.round(Math.random() * 200)
        db.set('money_' + message.author.id, money1)
        let money = await db.fetch(`money_${message.author.id}`)
        db.add(`cash_${message.author.id}`, money)
       const embed = new Discord.MessageEmbed()
        .setTitle("Crime")
        .setDescription('You broke into a shop and stole $' + money)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed) 
} else { 
    let wb = await db.fetch(`bank_${message.author.id}`)
    if (wb === null) db.set('bank_' + message.author.id, 0)
if (ws === 0 && wb !==0) {
let loss = Math.round(Math.random() * wb)
} else if (ws !==0) {
let loss = Math.round(Math.random() * ws) } else {
let loss = Math.round(Math.random() * 100)
}
if(loss > 3000) loss = 3000;
db.set('loss_' + message.author.id, loss)
const money11 = await db.fetch(`loss_${message.author.id}`)
db.subtract(`cash_${message.author.id}`, money11)
const embed1 = new Discord.MessageEmbed()
        .setTitle("Crime")
        .setDescription('You broke in a shop but were caught and were fined $' + money11)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed) 
}
        db.set(`crime_${message.author.id}`, Date.now())
  }
       
         }
}