module.exports = {
name: "donation-benefits",
description: "Claim your donation benefits.",
category: "Other",
execute: async (client, message, args) => {
    if (message.author.bot) return;
    const discord = require('discord.js')
    const embed = new discord.MessageEmbed()
    .setTitle('Benefits')
    .setDescription(`[Click Here](https://tinyurl.com/alfredredeemclaim) to claim your donation benefits.`)
    .setColor('#FFFFFF')
    .setTimestamp()
    message.channel.send(embed)
}
}