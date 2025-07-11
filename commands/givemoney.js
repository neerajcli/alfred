const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "givemoney",
    category: "Economy",
    description: "Give some of your money to another person!",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        const user = message.mentions.users.first() || client.users.cache.get(args[0])
        if(!user) return message.channel.send('Invalid user!')
        if(user.id === message.author.id) return message.channel.send('You cant give yourself money!')
        const toGive = args[1]
        const giver = await db.fetch(`cash_${message.author.id}`)
        if(giver === null) db.set('cash_' + message.author.id, 0)
        if(isNaN(args[1]) === true) return message.channel.send('Invalid Amount')
        if(toGive > giver) return message.channel.send('You dont have enough money to give!')
        if(toGive <= 0) return message.channel.send('You cant give 0 or less')
        db.subtract('cash_' + message.author.id, args[1])
        db.add('cash_' + user.id, args[1])
        const embed = new Discord.MessageEmbed()
        .setTimestamp()
        .setColor('#FFFFFF')
        .setTitle("Givemoney")
        .setDescription('You gave ' + user.username + " $" + toGive + "! The person has recieved your payment!")
        message.channel.send(embed)
    }
}