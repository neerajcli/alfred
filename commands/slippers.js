module.exports = {
    name: 'slipper',
    category: 'User Premium',
    description: 'Hit someone with slipper.',
    execute: async (client, message, args) => {
        const Discord = require('discord.js')
        const db = require ('quick.db')
        let isPremium = await db.fetch('userpremium_' + message.author.id)
        if(isPremium !== true) return message.channel.send('Only premium users can use this command.')
        const user = message.mentions.users.first();
  if(!user) return message.channel.send("🚫 Please Mention a Person to hit with slipper! 🚫")
  if(message.author.id === user.id) return message.channel.send(`${message.author.username}, Lets not do this  :/`)
        const response = ["https://media.discordapp.net/attachments/751829074095112192/966647747916738570/AdvancedMellowAmericansaddlebred-size_restricted.gif", "https://media.discordapp.net/attachments/751829074095112192/966647703364841482/angry-mad.gif", "https://media.discordapp.net/attachments/751829074095112192/966647354604285952/1bf189984e80fd05cbb0189dc8a3c145.gif", "https://media.discordapp.net/attachments/751829074095112192/966647339282468904/NMq3.gif", "https://media.discordapp.net/attachments/751829074095112192/966646706311684096/boys-over-flowers-hana-yori-dango.gif", "https://media.discordapp.net/attachments/751829074095112192/966649174001070090/ezgif.com-gif-maker.gif"] 

const randoms = response[Math.floor(Math.random() * response.length)]; 
      const embed = new Discord.MessageEmbed()
        .setTitle(`${message.author.username} hits ${user.username} with slipper! Woops!`)
        .setImage(randoms)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed)
        }
    }