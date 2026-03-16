const Discord = require('discord.js')
const { QuickDB } = require("quick.db")
const db = new QuickDB();
module.exports = {
    name: "afk-off",
    category: "Utility",
    description: "Turn off afk mode!",
    execute: async (client, message, args) => {
        let status = await db.get(`afk_${message.author.id}`)
        if(status === null) return message.channel.send('You are not AFK!')
        await db.delete('afk_' + message.author.id)
        await db.delete('afkreason_' + message.author.id)
        const embed = new Discord.MessageEmbed()
        .setTitle('AFK-OFF')
        .setDescription(`Turned off your AFK!`)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed)
    }
}