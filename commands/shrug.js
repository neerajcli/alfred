const Discord = require("discord.js")
module.exports = {
name : "shrug",
category : "Fun", 
description: "Shrug at something.",
execute : async (client, message, args) => { 
    function lpad(value, padding) {
    var zeroes = new Array(padding+1).join("0");
    return (zeroes + value).slice(-padding);
}
  const number = Math.round(Math.random() * 8)
const embed = new Discord.MessageEmbed()
.setTitle(`${message.author.tag} shrugs!`)
.setImage("https://nekos.best/api/v2/shrug/" + lpad(number, 3) + ".gif")
.setColor('#FFFFFF')
.setTimestamp()
message.channel.send(embed)
    }
    }