module.exports = {
name: "feedback",
description: "Give feedback for our bot.",
category: "Other",
execute: async (client, message, args) => {
    if (message.author.bot) return;
    const discord = require('discord.js')
    const embed = new discord.MessageEmbed()
    .setTitle('Feedback')
    .setDescription(`[Click Here](https://tinyurl.com/alfredbotfeedback) to give feedback for our bot.`)
    .setColor('#FFFFFF')
    .setTimestamp()
    message.channel.send(embed)
}
}