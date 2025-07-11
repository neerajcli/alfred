const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "remove-moderationword",
    category: "Moderation",
    description: "Removes a moderation word.",
    execute: async (client, message, args) => {
        if(!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('You cant do this.')
        let isEnabledwd = db.fetch('ewordm' + message.guild.id)
        if(isEnabledwd !== 1) return message.channel.send('Moderation words are not enabled.')
    let allowed = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
          if(!allowed.includes(args[0])) return message.channel.send('Invalid word number. Please ennter a number from 1 to 10')
    db.set('word' + args[0] + message.guild.id, null)
    message.channel.send('Successufully removed word' + args[0])
    }
    }
