const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "enable-wordmoderation",
    category: "Moderation",
    description: "Enables word moderation",
    execute: async (client, message, args) => {
        if(!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('You cant do this.')
    const ebwm = db.fetch('ewordm' + message.guild.id)
if(ebwm === 1) return message.channel.send('Word Moderation already enabled')
db.set('ewordm' + message.guild.id, 1)
  message.channel.send('Enabled word moderation. Use command `a!set-moderationword <word number> <word>` to set a word. Maximum of 10 words are allowed.')
    }
    }
