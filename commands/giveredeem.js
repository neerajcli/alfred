const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "giveredeem",
    category: "Economy",
    description: "Give some of your redeems to another person!",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        const user = message.mentions.users.first() || client.users.cache.get(args[0])
        if(!user) return message.channel.send('Invalid user!')
        if(user.id === message.author.id) return message.channel.send('You cant give yourself redeems!')
        const toGive = args[1]
        const giver = await db.fetch(`redeem_${message.author.id}`)
        if(giver === null) db.set('redeem_' + message.author.id, 0)
        if(isNaN(args[1]) === true) return message.channel.send('Invalid Amount')
        if(toGive > giver) return message.channel.send('You dont have enough redeems to give!')
        if(toGive <= 0) return message.channel.send('You cant give 0 or less redeem!')
        db.subtract('redeem_' + message.author.id, args[1])
        db.add('redeem_' + user.id, args[1])
        const embed = new Discord.MessageEmbed()
        .setTimestamp()
        .setColor('#FFFFFF')
        .setTitle("Giveredeem")
        .setDescription('You gave ' + user.username + " " + toGive + " redeems! The person has recieved your payment!")
        message.channel.send(embed)
    }
}