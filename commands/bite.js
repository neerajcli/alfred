const Discord = require("discord.js")
module.exports = {
name : "bite",
category : "Fun", 
description: "Bite someone.",
execute : async (client, message, args) => { 
    function lpad(value, padding) {
    var zeroes = new Array(padding+1).join("0");
    return (zeroes + value).slice(-padding);
}
   const user = message.mentions.users.first();
  if(!user) return message.channel.send("🚫 Please Mention a Person to bite! 🚫")
  if(message.author.id === user.id) return message.channel.send(`${message.author.username}, Lets not do this  :/`)
  const number = Math.round(Math.random() * 13)
const embed = new Discord.MessageEmbed()
.setTitle(`${message.author.username} bites ${user.username}`)
.setImage("https://nekos.best/api/v2/bite/" + lpad(number, 3) + ".gif")
.setColor('#FFFFFF')
 .setTimestamp()
message.channel.send(embed)
    }
    }