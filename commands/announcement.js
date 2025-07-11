module.exports = {
    name: 'announce',
    category: 'Server Premium',
    description: 'Announce something.',
    execute: async (client, message, args) => {
        const db = require('quick.db')
        if(message.author.bot) return;
      let isPremium = await db.fetch('serverpremium_' + message.guild.id)
if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
      if(!message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send('You cant do this')
        const channel1 = message.mentions.channels.first()
        if(!channel1) return message.channel.send('Please mention a valid channel')
        const channel = message.guild.channels.cache.get(channel1.id)
        const announce = args.slice(1).join(' ')
        if(!announce) return message.channel.send('Please provide an announcement!')
        const discord = require('discord.js')
        const embed = new discord.MessageEmbed()
        .setTitle('New Announcement')
        .setDescription(announce)
        .setColor('#FFFFFF')
        .setFooter(`Made by ${message.author.tag}`)
        channel.send(embed)
        message.channel.send('Announced!')
    }
}