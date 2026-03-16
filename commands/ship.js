module.exports = {
    name: "ship",
    category: "Fun",
    descriptipn: "Check how much you love someone!",
    execute: async (client, message, args) => {
        const Discord = require('discord.js')
        if(message.author.bot) return;
        const o = message.guild.members.cache.get(message.author.id)
        const p = message.mentions.members.first()
        if(!p) return message.channel.send('Please message someone to ship with!')
        if(p.id === message.author.id) return message.channel.send('❤️ You love yourself 101%! ❤️')

        const number = Math.round(Math.random() * 100)
        const embed = new Discord.MessageEmbed()
        .setTitle('Shipped')
        .setDescription('❤️ Love between ' + o.user.username + ` and ${message.mentions.users.first().username} is ` + number + '%! ❤️')
        .setColor("#FFFFFF")
        .setTimestamp()
        .setImage('https://media.discordapp.net/attachments/751829074095112192/753909997250936832/images_6.jpeg?width=543&height=427')
        message.channel.send(embed)
    }
}