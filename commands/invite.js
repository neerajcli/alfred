module.exports = {
name: "invite",
description: "Get bot's invitation link.",
category: "Other",
execute: async (client, message, args) => {
    if (message.author.bot) return;
    const discord = require('discord.js')
    const embed = new discord.MessageEmbed()
    .setTitle('Invitation Link')
    .setDescription(`[Click Here](https://top.gg/bot/670234327749099521/) to invite the bot to your server.`)
    .setColor('#FFFFFF')
    .setTimestamp()
    message.channel.send(embed)
}
}