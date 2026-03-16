const Discord = require('discord.js')
const { QuickDB } = require("quick.db")
const db = new QuickDB();
module.exports = {
    name: "server-shop",
    category: "Server Premium",
    description: "Custom shop for servers!",
    execute: async (client, message, args) => {
        let isPremium = await db.get('serverpremium_' + message.guild.id)
if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
        if(message.author.bot) return;
const authorpass = await db.get('econpass_' + message.author.id);
if(authorpass == null) return message.channel.send("Please create your bank password using `+reset-pass` to use this command");
        let a = await db.get(`item1_${message.guild.id}`)
        let b = await db.get(`item2_${message.guild.id}`)
        let c = await db.get(`item3_${message.guild.id}`)
        let d = await db.get(`item4_${message.guild.id}`)
        let e = await db.get(`item5_${message.guild.id}`)
        if(a === null) await db.set("item1_" + message.guild.id, "Not-Set");
        if(b === null) await db.set("item2_" + message.guild.id, "Not-Set");
        if(c === null) await db.set("item3_" + message.guild.id, "Not-Set");
        if(d === null) await db.set("item4_" + message.guild.id, "Not-Set");
        if(e === null) await db.set("item5_" + message.guild.id, "Not-Set");
        let item1 = await db.get(`item1_${message.guild.id}`)
        let item2 = await db.get(`item2_${message.guild.id}`)
        let item3 = await db.get(`item3_${message.guild.id}`)
        let item4 = await db.get(`item4_${message.guild.id}`)
        let item5 = await db.get(`item5_${message.guild.id}`)
        
        let f = await db.get(`price1_${message.guild.id}`)
        let g = await db.get(`price2_${message.guild.id}`)
        let h = await db.get(`price3_${message.guild.id}`)
        let i = await db.get(`price4_${message.guild.id}`)
        let j = await db.get(`price5_${message.guild.id}`)
        if(f === null) await db.set("price1_" + message.guild.id, "Not-Set");
        if(g === null) await db.set("price2_" + message.guild.id, "Not-Set");
        if(h === null) await db.set("price3_" + message.guild.id, "Not-Set");
        if(i === null) await db.set("price4_" + message.guild.id, "Not-Set");
        if(j === null) await db.set("price5_" + message.guild.id, "Not-Set");
        let price1 = await db.get(`price1_${message.guild.id}`)
        let price2 = await db.get(`price2_${message.guild.id}`)
        let price3 = await db.get(`price3_${message.guild.id}`)
        let price4 = await db.get(`price4_${message.guild.id}`)
        let price5 = await db.get(`price5_${message.guild.id}`) 
        
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