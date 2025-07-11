const Discord = require("discord.js")
module.exports = {
name : "dance",
category : "Fun", 
description: "You are dancing.",
execute : async (client, message, args) => { 
    function lpad(value, padding) {
    var zeroes = new Array(padding+1).join("0");
    return (zeroes + value).slice(-padding);
}
  const number = Math.round(Math.random() * 21)
const embed = new Discord.MessageEmbed()
.setTitle(`${message.author.tag} is dancing!`)
.setImage("https://nekos.best/api/v2/dance/" + lpad(number, 3) + ".gif")
.setColor('#FFFFFF')
.setTimestamp()
message.channel.send(embed)
    }
    }