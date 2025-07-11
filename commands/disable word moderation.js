const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "disable-wordmoderation",
    category: "Moderation",
    description: "Disables word moderation",
    execute: async (client, message, args) => {
        if(!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('You cant do this.')
    let dbwm = db.fetch('ewordm' + message.guild.id)
if(dbwm !== 1) return message.channel.send('Word moderation is not enabled')
db.set('ewordm' + message.guild.id, 0)
  message.channel.send('Disabled word moderation')
    }
    }
