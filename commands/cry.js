const Discord = require("discord.js")
module.exports = {
name : "cry",
category : "Fun", 
description: "Cry for something.",
execute : async (client, message, args) => { 
    function lpad(value, padding) {
    var zeroes = new Array(padding+1).join("0");
    return (zeroes + value).slice(-padding);
}
  const number = Math.round(Math.random() * 40)
const embed = new Discord.MessageEmbed()
.setTitle(`${message.author.tag} cries!`)
.setImage("https://nekos.best/api/v2/cry/" + lpad(number, 3) + ".gif")
.setColor('#FFFFFF')
.setTimestamp()
message.channel.send(embed)
    }
    }