const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "server-shop",
    category: "Server Premium",
    description: "Custom shop for servers!",
    execute: async (client, message, args) => {
        let isPremium = await db.fetch('serverpremium_' + message.guild.id)
if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
        if(message.author.bot) return;
        let a = await db.fetch(`item1_${message.guild.id}`)
        let b = await db.fetch(`item2_${message.guild.id}`)
        let c = await db.fetch(`item3_${message.guild.id}`)
        let d = await db.fetch(`item4_${message.guild.id}`)
        let e = await db.fetch(`item5_${message.guild.id}`)
        if(a === null) db.set("item1_" + message.guild.id, "Not-Set");
        if(b === null) db.set("item2_" + message.guild.id, "Not-Set");
        if(c === null) db.set("item3_" + message.guild.id, "Not-Set");
        if(d === null) db.set("item4_" + message.guild.id, "Not-Set");
        if(e === null) db.set("item5_" + message.guild.id, "Not-Set");
        let item1 = await db.fetch(`item1_${message.guild.id}`)
        let item2 = await db.fetch(`item2_${message.guild.id}`)
        let item3 = await db.fetch(`item3_${message.guild.id}`)
        let item4 = await db.fetch(`item4_${message.guild.id}`)
        let item5 = await db.fetch(`item5_${message.guild.id}`)
        
        let f = await db.fetch(`price1_${message.guild.id}`)
        let g = await db.fetch(`price2_${message.guild.id}`)
        let h = await db.fetch(`price3_${message.guild.id}`)
        let i = await db.fetch(`price4_${message.guild.id}`)
        let j = await db.fetch(`price5_${message.guild.id}`)
        if(f === null) db.set("price1_" + message.guild.id, "Not-Set");
        if(g === null) db.set("price2_" + message.guild.id, "Not-Set");
        if(h === null) db.set("price3_" + message.guild.id, "Not-Set");
        if(i === null) db.set("price4_" + message.guild.id, "Not-Set");
        if(j === null) db.set("price5_" + message.guild.id, "Not-Set");
        let price1 = await db.fetch(`price1_${message.guild.id}`)
        let price2 = await db.fetch(`price2_${message.guild.id}`)
        let price3 = await db.fetch(`price3_${message.guild.id}`)
        let price4 = await db.fetch(`price4_${message.guild.id}`)
        let price5 = await db.fetch(`price5_${message.guild.id}`) 
        
        const embed = new Discord.MessageEmbed()
        .setTitle("Server Shop")
        .setDescription('Use `a!server-buy <item-no.>` to buy that item! You will be given the role corresponding to the item name on buying the item! Set the items by doing `a!set-item <no> <@role> <price>`! Do `a!remove-item <item-no>` to remove an item!')
        .setColor('#FFFFFF')
        .setTimestamp()
        .addField(`1.) ${item1}`, `**Price:** $${price1}`)
        .addField(`2.) ${item2}`, `**Price:** $${price2}`)
        .addField(`3.) ${item3}`, `**Price:** $${price3}`)
        .addField(`4.) ${item4}`, `**Price:** $${price4}`)
        .addField(`5.) ${item5}`, `**Price:** $${price5}`)
        message.channel.send(embed)
    }
}