module.exports = {
    name: 'facekick',
    category: 'User Premium',
    description: 'Kick someone on face.',
    execute: async (client, message, args) => {
        const Discord = require('discord.js')
        const db = require ('quick.db')
        let isPremium = await db.fetch('userpremium_' + message.author.id)
        if(isPremium !== true) return message.channel.send('Only premium users can use this command.')
        const user = message.mentions.users.first();
  if(!user) return message.channel.send("🚫 Please Mention a Person to facekick! 🚫")
  if(message.author.id === user.id) return message.channel.send(`${message.author.username}, Lets not do this  :/`)
        const response = ["https://media.discordapp.net/attachments/751829074095112192/966636372146409542/in-yo-face-flying-side-kick.gif ", "https://media.discordapp.net/attachments/751829074095112192/966637952681771099/detective-conan-ran-mouri_AdobeCreativeCloudExpress.gif ", "https://media.discordapp.net/attachments/751829074095112192/966636684760457226/anime-kid.gif", "https://media.discordapp.net/attachments/751829074095112192/966636154575282226/cute-milk-and-mocha.gif", "https://media.discordapp.net/attachments/751829074095112192/966636358783365140/shida-midori-midori.gif", "https://media.discordapp.net/attachments/751829074095112192/966636666976620644/the-god-of-highschool-goh.gif", "https://media.discordapp.net/attachments/751829074095112192/966636506099892284/anime-ouch.gif", "https://media.discordapp.net/attachments/751829074095112192/966636068004835428/kick-anime-2.gif", "https://media.discordapp.net/attachments/751829074095112192/966636211487801364/stunt-fail.gif"] 
const randoms = response[Math.floor(Math.random() * response.length)];
        const embed = new Discord.MessageEmbed()
    .setTitle(`${message.author.username} kicks ${user.username} on face! Oops!`)
        .setImage(randoms)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed)
        }
    }