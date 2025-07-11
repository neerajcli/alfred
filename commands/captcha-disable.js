module.exports = {
    name: "captcha-off",
    category: "Verify",
    desription: "Turn off captcha verification for your server",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        if(!message.member.hasPermission('MANAGE_CHANNELS')) return message.channel.send('You cant do this.')
        const db = require('quick.db')
        const Discord = require('discord.js')
        let we = await db.fetch(`captchae_${message.guild.id}`)
        if (we !== true) return message.channel.send('Catcha verification system is not enabled.')
        db.set("captchae_" + message.guild.id, false)
        const embed = new Discord.MessageEmbed()
        .setTitle('Captcha system')
        .setDescription('Disabled captcha system in this server.')
        .setColor('#FFFFFF')
        message.channel.send(embed)
    }
}