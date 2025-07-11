const Discord = require('discord.js') 
const db = require('quick.db') 
const ms = require("parse-ms")
module.exports = {
    name: "rob",
    category: "Economy",
    description: "Rob someone and get their money",
    execute: async (client, message, args) => { 
let chance = Math.random(Math.round() * 10)
        if(message.author.bot) return; 
        const user = message.mentions.users.first()
        if(!user) return message.channel.send('Please mention someone to rob')
        if(user.id === message.author.id) return message.channel.send('You cant rob yourself!')
        if(user.id === '670234327749099521') return message.channel.send('You cant rob this user!')
        let timeout = 10800000; 
        let work = await db.fetch(`rob_${message.author.id}`);
if (work !== null && timeout - (Date.now() - work) > 0) {
    let time = ms(timeout - (Date.now() - work));
  let timeEmbed = new Discord.MessageEmbed()
    .setColor("#FFFFFF") 
    .setTitle("Cooldown")
    .setDescription(`You need to wait ${time.hours}h ${time.minutes}m ${time.seconds}s to use this command again.`);
    message.channel.send(timeEmbed)
  } else { 
      let security = await db.fetch(`security_${user.id}`)
      if(security !== true) {
 let ws1 = await db.fetch(`cash_${message.author.id}`)
 let cash = await db.fetch(`cash_${user.id}`)
if (ws1 === null) db.set('cash_' + message.author.id, 0); 
          if(cash <= 0) return message.channel.send('This user doesnt have any cash')
let ws = await db.fetch(`cash_${message.author.id}`)
if (chance <= 4) { 
    if(cash !== null) {
        let money1 = Math.round(Math.random() * cash)
        db.set('moneykk_' + message.author.id, money1)
        let money = await db.fetch(`moneykk_${message.author.id}`)
        db.add(`cash_${message.author.id}`, money)
        db.subtract(`cash_${user.id}`, money)
       const embed = new Discord.MessageEmbed()
        .setTitle("Rob")
        .setDescription('You robbed $' + money + ` from ${user.username}!`)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed) 
    } else if (cash === null) {
       const embed = new Discord.MessageEmbed()
        .setTitle("Rob")
        .setDescription(`You tried to rob ${user.username} but they had no money in cash for you to take!`)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed) 
    }
} else { 
    let wb = await db.fetch(`bank_${message.author.id}`)
    if (wb === null) db.set('bank_' + message.author.id, 0)
if (ws === 0 && wb !==0) {
let loss = Math.round(Math.random() * wb)
} else if (ws !==0) {
let loss = Math.round(Math.random() * ws) } else {
let loss = Math.round(Math.random() * 1000)
}
if(loss > 5000) loss = 5000;
db.set('loss1_' + message.author.id, loss)
const money11 = await db.fetch(`loss1_${message.author.id}`)
db.subtract(`cash_${message.author.id}`, money11)
const embed1 = new Discord.MessageEmbed()
        .setTitle("Rob")
        .setDescription(`You were caught trying to rob ${user.username} and were fined $` + money11)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed) 
}
      }
        else {
            const embed111 = new Discord.MessageEmbed()
            .setTitle('Rob')
            .setDescription(`You tried to rob ${user.username} but they had an active security`)
            .setColor('#FFFFFF')
            .setTimestamp()
            message.channel.send(embed111) 
            db.set(`security_${user.id}`, null)
        } 
        db.set(`rob_${message.author.id}`, Date.now()) 
  }
       
         }
}