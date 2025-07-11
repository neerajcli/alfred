const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "afk-off",
    category: "Utility",
    description: "Turn off afk mode!",
    execute: async (client, message, args) => {
        let status = await db.fetch(`afk_${message.author.id}`)
        if(status === null) return message.channel.send('You are not AFK!')
        db.set('afk_' + message.author.id, null)
        db.set('afkreason_' + message.author.id, null)
        const embed = new Discord.MessageEmbed()
        .setTitle('AFK-OFF')
        .setDescription(`Turned off your AFK!`)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed)
    }
}