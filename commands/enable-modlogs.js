module.exports = {
  name: "enable-modlogs",
  category: "Moderation",
  description: "Enabled modlogs on the server.",
  execute: async (client, message, args) => {
      if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
      const Discord = require ('discord.js')
      const db = require('quick.db')
      if(!message.member.hasPermission('MANAGE_CHANNELS')) return message.channel.send('You cant do this')
      let we = await db.fetch(`mode_${message.guild.id}`)
   if (we === true) { 
       return message.channel.send('Modlogs are already enabled!')
   } 
   else { 
       db.set(`mode_${message.guild.id}`, true)
       const embed = new Discord.MessageEmbed()
       .setTitle('Mod Logs')
       .setDescription('Mod Logs has been enabled on your server. Please set a logs channel by doing "a!set-logs-channel <#channel>".')
       .setColor('#FFFFFF')
       .setTimestamp()
       message.channel.send(embed)
   }
  }
}