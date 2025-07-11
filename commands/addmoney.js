const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "addmoney",
    description: "Adds money in mentioned users cash balance!",
    execute: async (client, message, args) => {
        let owners = [
            "504635146553524234",
        ]
    if (!owners.includes(message.author.id)) return;
    const user = message.mentions.users.first() || client.users.cache.get(args[0])
    if(!user) return message.channel.send("Invalid user!")
    const toAdd = args[1]
    if(!toAdd) return message.channel.send('Please specify an amount to add.')
    db.add('cash_' + user.id, args[1])
    const embed = new Discord.MessageEmbed()
    .setTitle('Addmoney')
    .setColor('#FFFFFF')
    .setTimestamp()
    .setDescription("Successufully added $" + toAdd + " in " + user.username + "'s cash balance.")
    message.channel.send(embed)
    }
}