const axios = require("axios")
const Discord = require("discord.js")
module.exports = {
name : "cat",
category : "Image", 
description: "Gives random cat image.",
execute : async (client, message, args) => { 
let response = await axios.get('https://api.thecatapi.com/v1/images/search', { params: { limit:1, size:"full" } } )
this.image = response.data[0] 
const embed = new Discord.MessageEmbed()
.setTitle('Cat! Meow!')
.setImage(this.image.url)
.setColor('#FFFFFF')
.setTimestamp()
message.channel.send(embed)
}
}