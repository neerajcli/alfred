const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "moderationwords",
    category: "Moderation",
    description: "Shows moderation words.",
    execute: async (client, message, args) => {
        if(!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('You cant do this.')
    let wordEnabled = db.fetch('ewordm' + message.guild.id)
            if(wordEnabled !== 1) return message.channel.send('Word moderation not enabled.')
            let word1 = db.fetch('word1' + message.guild.id)
            let word2 = db.fetch('word2' + message.guild.id)
            let word3 = db.fetch('word3' + message.guild.id)
            let word4 = db.fetch('word4' + message.guild.id)
            let word5 = db.fetch('word5' + message.guild.id)
            let word6 = db.fetch('word6' + message.guild.id)
            let word7 = db.fetch('word7' + message.guild.id)
            let word8 = db.fetch('word8' + message.guild.id)
            let word9 = db.fetch('word9' + message.guild.id)
            let word10 = db.fetch('word10' + message.guild.id)
            const embed = new Discord.MessageEmbed()
            .setTitle('Moderated Words')
            .addField('1', word1, true)
            .addField('2', word2, true)
            .addField('3', word3, true)
            .addField('4', word4, true)
            .addField('5', word5, true)
            .addField('6', word6, true)
            .addField('7', word7, true)
            .addField('8', word8, true)
            .addField('9', word9, true)
            .addField('10', word10, true)
            .setColor('#FFFFFF')
  message.channel.send(embed)
    }
    }
