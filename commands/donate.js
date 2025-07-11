module.exports = {
name: "donate",
description: "Donate to support our bot.",
category: "Other",
execute: async (client, message, args) => {
    if (message.author.bot) return;
    const discord = require('discord.js')
    const embed = new discord.MessageEmbed()
    .setTitle('Donating')
    .setDescription(`[Click Here](https://www.paypal.me/darkkillerbot) to donate for the bot.`)
    .setColor('#FFFFFF')
    .setTimestamp()
    message.channel.send(embed)
}
}