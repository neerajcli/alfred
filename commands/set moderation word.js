const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "set-moderationword",
    category: "Moderation",
    description: "Sets a moderation word.",
    execute: async (client, message, args) => {
        if(!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('You cant do this.')
        let isEnabledwd = db.fetch('ewordm' + message.guild.id)
        if(isEnabledwd !== 1) return message.channel.send('Moderation words are not enabled.')
    let allowed = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
          if(!allowed.includes(args[0])) return message.channel.send('Invalid word number. Please ennter a number from 1 to 10')
          if(!args[1]) return message.channel.send('Please specify a word')
          if(args[2]) return message.channel.send('You cannot specify two words.')
          db.set('word' + args[0] + message.guild.id, args[1])
          const embed = new Discord.MessageEmbed()
          .setTitle('Word Set')
          .setDescription('Successufully set word' + args[0] + ' to ' + args[1])
  .setColor('#FFFFFF')
            message.channel.send(embed)
    }
    }
