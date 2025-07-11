const Discord = require("discord.js")
module.exports = {
name : "blush",
category : "Fun", 
description: "Blush at something.",
execute : async (client, message, args) => { 
    function lpad(value, padding) {
    var zeroes = new Array(padding+1).join("0");
    return (zeroes + value).slice(-padding);
}
  const number = Math.round(Math.random() * 13)
const embed = new Discord.MessageEmbed()
.setTitle(`${message.author.tag} blushes!`)
.setImage("https://nekos.best/api/v2/blush/" + lpad(number, 3) + ".gif")
.setColor('#FFFFFF')
.setTimestamp()
message.channel.send(embed)
    }
    }