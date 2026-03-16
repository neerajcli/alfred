const Discord = require("discord.js")
const { QuickDB } = require("quick.db")
const db = new QuickDB();
module.exports = {
  name: "enable-welcome",
  category: "Greet",
  description: "Enables welcomer on your server.",
  execute: async (client, message, args) => { 

  if(!message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send("You can't do this!")
   let we = await db.get(`we_${message.guild.id}`)
   if (we === true) { 
       return message.channel.send('Welcome messages are already enabled!')
   }
   else {
       await db.set("we_" + message.guild.id, true)
       const embed = new Discord.MessageEmbed()
       .setTitle('Welcome Message')
       .setDescription('Enabled Welcomer Messages on this server! PLease set a welcomer channel by doing "a!set-welcomer-channel <#channel>"!')
       .setColor('#FFFFFF')
       .setTimestamp()
       message.channel.send(embed)
   }
   } 
}