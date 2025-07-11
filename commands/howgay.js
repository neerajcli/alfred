module.exports = {
    name: 'howgay',
    description: 'Get gay rate of the mentioned user',
    category: "Fun",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        const user = message.mentions.members.first()
        const user1 = user
        if(!user) return message.channel.send('Please mention someone')
        const percentage = Math.round(Math.random() * 100)
        const discord = require('discord.js')
        const embed = new discord.MessageEmbed()
        .setTitle('Gayrate')
        .setDescription(`${message.mentions.users.first().username} is ` +  percentage + '% gay.')
        .setTimestamp()
        .setColor('#FFFFFF')
        message.channel.send(embed)
    }
}