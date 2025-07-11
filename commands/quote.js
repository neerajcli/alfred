module.exports = {

    name: 'quote',

    category: 'Server Premium',

    description: 'Quote a message from any channel in the server.',

    execute: async (client, message, args) => {

        const db = require('quick.db')

        if(message.author.bot) return;

      let isPremium = await db.fetch('serverpremium_' + message.guild.id)

if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')

      if(!message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send('You need manage channels permission.')
        const Discord = require('discord.js')
        const channel1 = message.mentions.channels.first()
        if(!channel1) return message.channel.send('Please mention the channel in which message is there, correct format is `a!quote <message id> #channel`')
        if(!args[0]) return message.channel.send('Please provide message id, correct format is `a!quote <message id> #channel`')
        if(isNaN(args[0]) === true) return message.channel.send('Invalid message id, correct format is `a!quote <message id> #channel`')
        channel1.messages
    .fetch(args[0])
    .then(msg => {
            if(!msg) return
            const embed = new Discord.MessageEmbed()
  .setTitle(`${msg.author.username}#${msg.author.discriminator}`)
            .setThumbnail(msg.author.avatarURL())
            .setDescription(msg.content, `[Jump to Message](https://discordapp.com/channels/${message.guild.id}/${channel1.id}/${args[0]})`)
            .setFooter(`Requested by ${message.author.username}#${message.author.discriminator}`)
        client.channels
            .fetch(message.channel.id)
            .then(channel2 => channel2.send(embed))
            .catch(console.error)
    })
    .catch(console.error).then(() => {
            message.channel.send('Invalid message id or message not found in mentioned channel.')
            })
        
        }
    }