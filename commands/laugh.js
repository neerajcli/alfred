const Discord = require("discord.js")
module.exports = {
name : "laugh",
category : "Fun", 
description: "Laugh on something.",
execute : async (client, message, args) => { 
    function lpad(value, padding) {
    var zeroes = new Array(padding+1).join("0");
    return (zeroes + value).slice(-padding);
}
  const number = Math.round(Math.random() * 19)
const embed = new Discord.MessageEmbed()
.setTitle(`${message.author.tag} is laughing!`)
.setImage("https://nekos.best/api/v2/laugh/" + lpad(number, 3) + ".gif")
.setColor('#FFFFFF')
.setTimestamp()
message.channel.send(embed)
    }
    }