module.exports = {
name: "bot-invite",
description: "Get invitation link of any bot.",
category: "Other",
execute: async (client, message, args) => {
    if (message.author.bot) return;
    const discord = require('discord.js')
    if(!args[0]) return message.channel.send('Please provide a bot ID!')
    const embed = new discord.MessageEmbed()
    .setTitle('Bot Invite URL')
    .setDescription(`[Click Here](https://discordapp.com/oauth2/authorize?client_id=${args[0]}&scope=bot) to invite that bot in your server.`)
    .setColor('#FFFFFF')
    .setTimestamp()
    message.channel.send(embed)
}
}