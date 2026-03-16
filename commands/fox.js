const Discord = require("discord.js")
module.exports = {
name : "fox",
category : "Image", 
description: "Gives random fox image.",
execute : async (client, message, args) => {
    const number = Math.round(Math.random() * 100)
const embed = new Discord.MessageEmbed()
.setTitle("Fox!")
.setImage("http://randomfox.ca/images/" + number + ".jpg")
.setColor('#FFFFFF')
.setTimestamp()
message.channel.send(embed)
}
}