module.exports = {
    name: 'support',
    description: "Get invite to bot's suppoer server.",
    category: 'Other',
    execute: async (client, message, args) => {
        const discord = require('discord.js')
        const embed = new discord.MessageEmbed()
        .setTitle('Support Server')
        .setDescription(`Support server has been removed. Email us at darkkiller234567@gmail.com if you need any help. If you want to check bot's status [Click Here](https://alfredbot.statuspage.io/).`)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed)
    }
}