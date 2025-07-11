module.exports = {
  name: "purge",
  category: "Utility",
  description: "Bulks deleted messages",
  execute: async (client, message, args) => {
      if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
      const Discord = require('discord.js')
 if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("You can't do this!");
 if(!args[0]) return message.channel.send('Specify number of messages to delete!');
 if(args[0] > 100) return message.channel.send('You can delete a maximum of 100 messages!');
 if(args[0] < 1) return message.channel.send('You cant delete less than 1 message!')
 if(isNaN(args[0])) return message.channel.send("It is Not a Valid Number to Purge")
 message.channel.bulkDelete(1).then(() => {
 message.channel.bulkDelete(args[0])
}
)
   }
}