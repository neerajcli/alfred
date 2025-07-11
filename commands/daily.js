const Discord = require('discord.js')
const DBL = require("dblapi.js");
const db = require('quick.db')
const ms = require("parse-ms")
let ws = db.fetch('client_')
const client = ws
const dbl = new DBL('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MDIzNDMyNzc0OTA5OTUyMSIsImJvdCI6dHJ1ZSwiaWF0IjoxNjAyMjk5MzIyfQ.MJXY--mPk1GAzr6rg4llAGrsMLahPvVvf86aB0F7DEo', client);
module.exports = {
name: "daily",
category: "Economy",
description: "Get some money by voting for the bot every 12 hours.",
execute: async (client, message, args) => {
    dbl.hasVoted(message.author.id).then(async voted => {
    if (voted) {
        let timeout = 43200000 
let daily = await db.fetch(`daily_${message.author.id}`);
if (daily !== null && timeout - (Date.now() - daily) > 0) {
    let time = ms(timeout - (Date.now() - daily));
  let timeEmbed = new Discord.MessageEmbed()
    .setColor("#FFFFFF") 
    .setTitle("Cooldown")
    .setDescription(`You need to wait ${time.hours}h ${time.minutes}m ${time.seconds}s to use this command again.`);
    message.channel.send(timeEmbed)
  } else { 
let money1 = Math.round(Math.random() *500)
db.set('moneydaily_' + message.author.id, money1)
let money = await db.fetch(`moneydaily_${message.author.id}`)
const embed1 = new Discord.MessageEmbed()
.setTitle('Daily Claim')
.setColor('#FFFFFF')
.setTimestamp()
.setDescription('You got $' + money + ' from your daily reward. Vote after 12 hours to claim this again!')
message.channel.send(embed1)
db.add('cash_' + message.author.id, money) 
db.set('daily_' + message.author.id, Date.now())
 }
      } else{
        const embed = new Discord.MessageEmbed()
        .addField("Voting Rewards", `You haven't voted today, **[click here](https://top.gg/bot/670234327749099521/vote)** to vote and try again!`)
        .setColor("#FFFFFF")
        .setFooter("If it doesn't work after voting, please wait 5-10 minutes and then try again!")
        message.channel.send(embed)
      }
    })
        }

}