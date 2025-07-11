module.exports = {
    name: 'set-captcha-role',
    description: "Set a captcha role to given when someone verifies.",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        const db = require('quick.db')
        if(!message.member.hasPermission('MANAGE_CHANNELS')) return message.channel.send('You cant do this')
        const Discord = require('discord.js')
        const we = await db.fetch(`captchae_${message.guild.id}`)
        if (we !== true) return message.channel.send('Captcha system is not enabled.')
        const role = message.mentions.roles.first();
        if(!role) return message.channel.send('Please mention a valid role!')
        db.set("captchar_" + message.guild.id, role.id)
        db.set("captchare_" + message.guild.id, true)
        const embed = new Discord.MessageEmbed()
        .setTitle('Captcha Role')
        .setDescription('Captcha role has been set to <@&' + role.id + '>.')
        .setColor('#FFFFFF')
        message.channel.send(embed)
    }
}