module.exports = {
  name: "set-welcomer-channel",
  description: "Sets Welcomer Channel on your server.",
  execute: async (client, message, args) => { 
  const Discord = require("discord.js")
  const db = require('quick.db')
  if(!message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send("You can't do this!")
   let we = await db.fetch(`we_${message.guild.id}`)
   if (we !== true) { 
       return message.channel.send('Welcome messages are not enabled on your server!')
   }
   else { 
       const channel = message.mentions.channels.first()
       if (!channel) return message.channel.send('Please specify a channel')
       db.set("wc_" + message.guild.id, channel.id)
       db.set("ws_" + message.guild.id, true)
       const embed = new Discord.MessageEmbed()
       .setTitle('Welcome Message Channel')
       .setDescription('Welcome message channel has been set to <#' + channel.id + '>!')
       .setColor('#FFFFFF')
       .setTimestamp()
       message.channel.send(embed)
   }
   } 
}