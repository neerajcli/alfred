const Discord = require("discord.js")
module.exports = {
name : "stare",
category : "Fun", 
description: "Stare at someone.",
execute : async (client, message, args) => { 
    function lpad(value, padding) {
    var zeroes = new Array(padding+1).join("0");
    return (zeroes + value).slice(-padding);
}
   const user = message.mentions.users.first();
  if(!user) return message.channel.send("🚫 Please Mention a Person to stare at! 🚫")
  if(message.author.id === user.id) return message.channel.send(`${message.author.username}, Lets not do this  :/`)
  const number = Math.round(Math.random() * 14)
const embed = new Discord.MessageEmbed()
.setTitle(`${message.author.username} stares at ${user.username}`)
.setImage("https://nekos.best/api/v2/stare/" + lpad(number, 3) + ".gif")
.setColor('#FFFFFF')
 .setTimestamp()
message.channel.send(embed)
    }
    }