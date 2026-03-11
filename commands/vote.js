module.exports = {
name: "vote",
description: "Vote the bot on top.gg.",
category: "Other",
execute: async (client, message, args) => {
    if (message.author.bot) return;
    const discord = require('discord.js')
    const embed = new discord.MessageEmbed()
    .setTitle('Voting')
    .setDescription(`[Click Here](https://top.gg/bot/670234327749099521/vote) to vote for the bot.`)
    .setColor('#FFFFFF')
    .setTimestamp()
    message.channel.send(embed)
}
}