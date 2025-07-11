module.exports = {
    name: "captcha-on",
    category: "Verify",
    desription: "Turn on captcha verification for your server",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        if(!message.member.hasPermission('MANAGE_CHANNELS')) return message.channel.send('You cant do this.')
        const db = require('quick.db')
        const Discord = require('discord.js')
        let we = await db.fetch(`captchae_${message.guild.id}`)
        if (we === true) return message.channel.send('Catcha verification system is already enabled.')
        db.set("captchae_" + message.guild.id, true)
        const embed = new Discord.MessageEmbed()
        .setTitle('Captcha system')
        .setDescription('Enabled captcha system in this server. Please set a captcha role by doing `a!set-captcha-role <@role>`.')
        .setColor('#FFFFFF')
        message.channel.send(embed)
    }
}