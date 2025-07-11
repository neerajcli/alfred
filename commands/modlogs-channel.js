module.exports = {
  name: "set-logs-channel",
  description: "Sets Logs Channel on your server.",
  execute: async (client, message, args) => { 
  const Discord = require("discord.js")
  const db = require('quick.db')
  if(!message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send("You can't do this!")
   let we = await db.fetch(`mode_${message.guild.id}`)
   if (we !== true) { 
       return message.channel.send('Modlogs are not enabled on your server!')
   }
   else { 
       const channel = message.mentions.channels.first()
       if (!channel) return message.channel.send('Please specify a channel')
       db.set("modc_" + message.guild.id, channel.id)
       db.set("modcd_" + message.guild.id, true)
       const embed = new Discord.MessageEmbed()
       .setTitle('Logs Channel')
       .setDescription('Logs channel has been set to <#' + channel.id + '>!')
       .setColor('#FFFFFF')
       .setTimestamp()
       message.channel.send(embed)
   }
   } 
}