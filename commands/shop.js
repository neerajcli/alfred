const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "shop",
    category: "Economy",
    description: "Official shop for alfred bot!",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        const embed = new Discord.MessageEmbed()
        .setTitle("Shop")
        .setDescription('Use `a!buy-item <item name>` to buy an item and `a!item-info <item-name>` to get more information about that item!')
        .addField('Security', '**Price:** $3000')
        .addField('Mysterious Box', '**Price:** $5000')
        .addField('Redeem', '**Price:** $20000')
        .addField('Big Money', '**Price:** $500000')
        .addField('Alfred Coin', '**Price:** $900000')
        .addField('User Premium - 1 Month', '**Price:** $1000000')
        .addField('User PromoCode Premium - 1 Month', '**Price:** $1000000')
        .addField('Server Premium - 1 Month', '**Price:** $1000000')
        .addField('Server PromoCode Premium - 1 Month', '**Price:** $1000000')
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed)
    }
}