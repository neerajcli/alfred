const Discord = require('discord.js')
const { QuickDB } = require("quick.db")
      const db = new QuickDB();
module.exports = {
    name: "remove-item",
    description: "Remove custom shop items!",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        let isPremium = await db.get('serverpremium_' + message.guild.id)
if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
        if(!message.member.hasPermission("MANAGE_ROLES")) return message.channel.send('You dont have perms to do it!')
        const items = ["1", "2", "3", "4", "5"]
        if(!items.includes(args[0])) return message.channel.send('Invalid Item No.!')
        await db.set(`item${args[0]}_${message.guild.id}`, "Not-Set")
        await db.set(`price${args[0]}_${message.guild.id}`, "Not-Set")
        const embed = new Discord.MessageEmbed()
        .setTitle("Remove-Item")
        .setColor('#FFFFFF')
        .setTimestamp()
        .setDescription(`Successful in removing item${args[0]}!`)
        message.channel.send(embed)
    }
}