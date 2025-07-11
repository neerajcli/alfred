module.exports = {
    name: 'status',
    description: "Know bot's status.",
    category: 'Other',
    execute: async (client, message, args) => {
        const discord = require('discord.js')
        const embed = new discord.MessageEmbed()
        .setTitle('Bot Status')
        .setColor('#FFFFFF')
        .setDescription(`[Click Here](https://alfredbot.statuspage.io/) to know bots status and get some information about it.`)
        message.channel.send(embed)
        }
    }


