const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "item-info",
    description: "Get info about an item from shop!",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        let item1 = args.slice(0).join(' ')
        let item = item1.toLowerCase()
        let responses = ["security", "mysterious box", "redeem", "alfred coin", "big money", "user premium", "user promocode premium", "server premium", "server promocode premium"]
        if(!responses.includes(item)) return message.channel.send('Invalid Item')
        
        const securityEmbed = new Discord.MessageEmbed()
        .setTitle('Security')
        .setDescription('Buy it and you cant be robbed for 1 time!')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const mysteriousEmbed = new Discord.MessageEmbed()
        .setTitle('Mysterious Box')
        .setDescription('Buy it and try your luck! You will get 2000$ - 8000$ or if you are lucky enough then you will get a redeem!')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const redeemEmbed = new Discord.MessageEmbed()
        .setTitle('Redeem')
        .setDescription('Buy it and you will get a redeem!')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const coinEmbed = new Discord.MessageEmbed()
        .setTitle('Alfred Coin')
        .setDescription('A coin which only kings can afford, only rich people can buy it as you will get nothing on buying it, it will just appear in your balance!')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const bigEmbed = new Discord.MessageEmbed()
        .setTitle('Big Money')
        .setDescription('Buy it and you will get 1000$ every hour by using `a!claim-bigmoney`!')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const userpremiumEmbed = new Discord.MessageEmbed()
        .setTitle('User Premium')
        .setDescription('Buy it and you will become a premium member for 1 month.')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const userpromocodeEmbed = new Discord.MessageEmbed()
        .setTitle('User PromoCode Premium')
        .setDescription("Buy it and you will get a user premium promocode. The person who claims it will get 1 month premium from the date the promocode was generated irrespective of claim date. MAKE SURE YOUR DM'S ARE ON BEFORE BUYING AS PROMOCODE WILL BE SENT IN DM'S. Use `a!userpromoclaim <promocode>` to claim.")
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const serverpremiumEmbed = new Discord.MessageEmbed()
        .setTitle('Server Premium')
        .setDescription('Buy it and the server in which you buy it will become a premium server for 1 month.')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const serverpromocodeEmbed = new Discord.MessageEmbed()
        .setTitle('Server PromoCode Premium')
        .setDescription("Buy it and you will get a server premium promocode. The server in which it is claimed will get 1 month premium from the date the promocode was generated irrespective of claim date. MAKE SURE YOUR DM'S ARE ON BEFORE BUYING AS PROMOCODE WILL BE SENT IN DM'S. Use `a!serverpromoclaim <promocode>` to claim.")
        .setColor('#FFFFFF')
        .setTimestamp()
        
        if(item === "security") {
            message.channel.send(securityEmbed)
        } else if(item === "mysterious box") {
            message.channel.send(mysteriousEmbed)
        } else if(item === "redeem") {
            message.channel.send(redeemEmbed)
        } else if(item === "alfred coin") {
            message.channel.send(coinEmbed)
        } else if(item === "big money") {
            message.channel.send(bigEmbed)
        } else if(item === "user premium") {
            message.channel.send(userpremiumEmbed)
        } else if(item === "user promocode premium") {
            message.channel.send(userpromocodeEmbed)
        } else if(item === "server promocode premium") {
            message.channel.send(serverpromocodeEmbed)
        }else if(item === "server premium") {
            message.channel.send(serverpremiumEmbed)
        } else {
            return;
        }
        
    }
}