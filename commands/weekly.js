const Discord = require('discord.js')

const db = require('quick.db')
const ms = require("parse-ms")

module.exports = {
name: "weekly",
category: "User Premium",
description: "Get some money every week.",
execute: async (client, message, args) => {
    let isPremium = await db.fetch('userpremium_' + message.author.id)
    if(isPremium !== true) return message.channel.send('Only premium members can use this command.')
  let timeout = 604800000  
  let weekly = await db.fetch(`weekly_${message.author.id}`);
if (weekly !== null && timeout - (Date.now() - weekly) > 0) {
    let time = ms(timeout - (Date.now() - weekly));
  let timeEmbed = new Discord.MessageEmbed()
    .setColor("#FFFFFF") 
    .setTitle("Cooldown")
    .setDescription(`You need to wait ${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s to use this command again.`);
    message.channel.send(timeEmbed)
  } else { 
let money1 = Math.round(Math.random() *10000)
db.set('moneyweekly_' + message.author.id, money1)
let money = await db.fetch(`moneyweekly_${message.author.id}`)
const embed1 = new Discord.MessageEmbed()
.setTitle('Weekly Claim')
.setColor('#FFFFFF')
.setTimestamp()
.setDescription('You got $' + money + ' from your weekly reward. Use the command after 7 days to claim this again!')
message.channel.send(embed1)
db.add('cash_' + message.author.id, money) 
db.set('weekly_' + message.author.id, Date.now())
      }
    }
    }