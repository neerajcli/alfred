const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "addredeem",
    description: "Adds redeem in mentioned users balance!",
    execute: async (client, message, args) => {
        let owners = [
            "504635146553524234",
        ]
    if (!owners.includes(message.author.id)) return;
    const user = message.mentions.users.first() || client.users.cache.get(args[0])
    if(!user) return message.channel.send("Invalid user!")
    const toAdd = args[1]
    if(!toAdd) return message.channel.send('Please specify an amount to add.')
    db.add('redeem_' + user.id, args[1])
    const embed = new Discord.MessageEmbed()
    .setTitle('Addredeem')
    .setColor('#FFFFFF')
    .setTimestamp()
    .setDescription("Successufully added " + toAdd + " redeems in " + user.username + "'s balance.")
    message.channel.send(embed)
    }
}