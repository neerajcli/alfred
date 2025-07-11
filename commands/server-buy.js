const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "server-buy",
    description: "Buy an item from sever shop!",
    execute: async (client, message, args) => {
        let isPremium = await db.fetch('serverpremium_' + message.guild.id)
if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
        if(message.author.bot) return;
        const cash = await db.fetch(`cash_${message.author.id}`)
        let a = ["1", "2", "3", "4", "5"]
        if(!a.includes(args[0])) return message.channel.send('Invalid Item')
        let items = await db.fetch(`item${args[0]}_${message.guild.id}`)
        if(items === null) db.set(`item${args[0]}_${message.guild.id}`, "Not-Set")
        let item = await db.fetch(`item${args[0]}_${message.guild.id}`)
        if(item === "Not-Set") return message.channel.send('There is nothing in the selected item!')
        const role = message.guild.roles.cache.find(roless => roless.name === item)
        if(!role) return message.channel.send("Role not found in server! Please contact a server admin!")
        const user = message.guild.members.cache.get(message.author.id)
        if(user.roles.cache.has(role.id)) return message.channel.send('You already have this role!')
        const price = await db.fetch(`price${args[0]}_${message.guild.id}`)
        if(cash < price) return message.channel.send('You dont have enough money in cash to buy this item!')
        db.subtract("cash_" + message.author.id, price)
        user.roles.add(role)
        const embed = new Discord.MessageEmbed()
        .setTitle("Server-Buy")
        .setColor("#FFFFFF")
        .setTimestamp()
        .setDescription(`You successfully bought ${item} for $${price}, role has been added. If you didnt got the role that can be because of permission issues, please contact a server admin!`)
        message.channel.send(embed)
    }
}