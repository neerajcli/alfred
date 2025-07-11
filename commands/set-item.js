const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "set-item",
    description: "Set custom shop items!",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        let isPremium = await db.fetch('serverpremium_' + message.guild.id)
if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
        if(!message.member.hasPermission("MANAGE_ROLES")) return message.channel.send('You dont have perms to do it!')
        const items = ["1", "2", "3", "4", "5"]
        if(!items.includes(args[0])) return message.channel.send('Invalid Item No.!')
        const role = message.mentions.roles.first()
        if(!role) return message.channel.send('Please mention a role!')
        if(args[2] < 1) return message.channel.send('You should have atleast a minimum price of 1$!')
        if(isNaN(args[2])) return message.channel.send('Invalid Price!')
        db.set(`item${args[0]}_${message.guild.id}`, role.name)
        db.set(`price${args[0]}_${message.guild.id}`, args[2])
        const embed = new Discord.MessageEmbed()
        .setTitle("Set-Item")
        .setColor('#FFFFFF')
        .setTimestamp()
        .setDescription(`Successful in setting item${args[0]} to ${role.name} with price $${args[2]}!`)
        message.channel.send(embed)
    }
}