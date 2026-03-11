const Discord = require('discord.js')
const { QuickDB } = require("quick.db")
const db = new QuickDB();
module.exports = {
    name: "useredeem",
    category: "Economy",
    description: "Use your redeem and get 20000$",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        let redeem = await db.get(`redeem_${message.author.id}`)
        if(redeem === null) await db.set('redeem_' + message.author.id, 0)
        if(redeem <= 0) return message.channel.send('You dont have any available redeems!')
        await db.sub('redeem_' + message.author.id, 1)
        await db.add('cash_' + message.author.id, 20000)
        const embed = new Discord.MessageEmbed()
        .setTitle("Use redeem")
        .setDescription('You used your redeem and got $20000!')
        .setColor('#FFFFF')
        .setTimestamp()
        message.channel.send(embed)
    }
}