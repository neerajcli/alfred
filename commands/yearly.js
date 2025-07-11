const Discord = require('discord.js')

const db = require('quick.db')
const ms = require("parse-ms")

module.exports = {
name: "yearly",
category: "User Premium",
description: "Get some money every 365 days.",
execute: async (client, message, args) => {
    let isPremium = await db.fetch('userpremium_' + message.author.id)
    if(isPremium !== true) return message.channel.send('Only premium members can use this command.')
  let timeout =  31536000000 
  let yearly = await db.fetch(`yearly_${message.author.id}`);
if (yearly !== null && timeout - (Date.now() - yearly) > 0) {
    let time = ms(timeout - (Date.now() - yearly));
  let timeEmbed = new Discord.MessageEmbed()
    .setColor("#FFFFFF") 
    .setTitle("Cooldown")
    .setDescription(`You need to wait ${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s to use this command again.`);
    message.channel.send(timeEmbed)
  } else { 
let money1 = Math.round(Math.random() *500000)
db.set('moneyyearly_' + message.author.id, money1)
let money = await db.fetch(`moneyyearly_${message.author.id}`)
const embed1 = new Discord.MessageEmbed()
.setTitle('Yearly Claim')
.setColor('#FFFFFF')
.setTimestamp()
.setDescription('You got $' + money + ' from your yearly reward. Use the command after 365 days to claim this again!')
message.channel.send(embed1)
db.add('cash_' + message.author.id, money) 
db.set('yearly_' + message.author.id, Date.now())
      }
    }
    }