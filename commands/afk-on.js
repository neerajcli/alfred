const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "afk-on",
    category: "Utility",
    description: "Turn on afk mode!",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        let status = await db.fetch(`afk_${message.author.id}`)
        if(status === true) return message.channel.send('You are already AFK!')
        let reason = args.slice(0).join(' ')
        if(!reason) reason = "No Reason Provided";
        db.set('afk_' + message.author.id, true)
        db.set('afkreason_' + message.author.id, reason)
        const embed = new Discord.MessageEmbed()
        .setTitle('AFK-ON')
        .setDescription(`Turned on your AFK for ${reason}!`)
        .setColor('#FFFFFF')
        .setTimestamp()
        message.channel.send(embed)
    }
}