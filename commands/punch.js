const Discord = require("discord.js")
const fetch = require('node-fetch');
module.exports = {
name : "punch",
category : "Fun", 
description: "Punch someone.",
execute : async (client, message, args) => { 
   const user = message.mentions.users.first();
  if(!user) return message.channel.send("🚫 Please Mention a Person to punch! 🚫")
  if(message.author.id === user.id) return message.channel.send(`${message.author.username}, Lets not do this  :/`)

    const db = require('quick.db')
    db.add('punch_' + message.author.id + user.id, 1)
 let punchno = await db.fetch('punch_' + message.author.id + user.id)
 var obj;
fetch("https://nekos.best/api/v2/punch").then(response => {
      return response.json();
  })
  .then(data => {
    obj=data.results[0].url
  }).then(() => {

const embed = new Discord.MessageEmbed()
.setTitle(`${message.author.username} punches ${user.username}`)
.setImage(obj)
.setColor('#FFFFFF')
 .setFooter(`There are ${punchno} punches now!`)
message.channel.send(embed)
    })
    }
    }