module.exports = {
  name: "disable-welcome",
  category: "Greet",
  description: "Disables welcomer on your server.",
  execute: async (client, message, args) => { 
  const Discord = require("discord.js")
  const db = require('quick.db')
  if(!message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send("You can't do this!")
   let we = await db.fetch(`we_${message.guild.id}`)
   if (we !== true)  { 
       return message.channel.send('Welcome messages are not enabled!')
   }
   else {
       db.set("we_" + message.guild.id, false)
       const embed = new Discord.MessageEmbed()
       .setTitle('Welcome Message')
       .setDescription('DIsabled Welcomer Messages on this server!')
       .setColor('#FFFFFF')
       .setTimestamp()
       message.channel.send(embed)
   }
   } 
}