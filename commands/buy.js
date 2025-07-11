const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "buy-item",
    description: "Buy an item from the shop!",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        let item1 = args.slice(0).join(' ')
        let item = item1.toLowerCase()
        let responses = ["security", "mysterious box", "redeem", "alfred coin", "big money", "user premium", "user promocode premium", "server premium", "server promocode premium"]
        if(!responses.includes(item)) return message.channel.send('Invalid Item Provided')
        
        const securityEmbed = new Discord.MessageEmbed()
        .setTitle('Security')
        .setDescription('You have bought security, rob protection is now active!')
        .setColor('#FFFFFF')
        .setTimestamp() 
    
        let money1 = Math.round(Math.random() * 6000)
        db.set('kkkkk_' + message.author.id, money1)
        db.add('kkkkk_' + message.author.id, 2000)
        let money = await db.fetch(`kkkkk_${message.author.id}`)
        const mysteriousEmbedMoney = new Discord.MessageEmbed()
        .setTitle('Mysterious Box')
        .setDescription('You bought a mysterious box. On opening it you found $' + money + "!")
        .setColor('#FFFFFF')
        .setTimestamp()
        const mysteriousEmbedRedeem = new Discord.MessageEmbed()
        .setTitle('Mysterious Box')
        .setDescription('You opened a mysterious box and were so lucky that you found a redeem!')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const redeemEmbed = new Discord.MessageEmbed()
        .setTitle('Redeem')
        .setDescription('You have been given a redeem!')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const coinEmbed = new Discord.MessageEmbed()
        .setTitle('Alfred Coin')
        .setDescription('You have bought alfred coin, show-off in your balance now!')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const bigEmbed = new Discord.MessageEmbed()
        .setTitle('Big Money')
        .setDescription('You have bought big-money, claim your 1000$ every hour by doing `a!claim-bigmoney`!')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const userpremiumEmbed = new Discord.MessageEmbed()
        .setTitle('User Premium')
        .setDescription('You are now a premium member for 1 month.')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const userpromocodeEmbed = new Discord.MessageEmbed()
        .setTitle('User PromoCode Premium')
        .setDescription('The promocode has been sent to ur dm, it is valid for 1 month starting from now irrespective of claim date. Use `a!userpromoclaim <promocode>` to claim.')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const serverpremiumEmbed = new Discord.MessageEmbed()
        .setTitle('Server Premium')
        .setDescription('This server is now a premium server for 1 month.')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        const serverpromocodeEmbed = new Discord.MessageEmbed()
        .setTitle('Server PromoCode Premium')
        .setDescription('The promocode has been sent to ur dm, it is valid for 1 month starting from now irrespective of claim date. Use `a!serverpromoclaim <promocode>` to claim.')
        .setColor('#FFFFFF')
        .setTimestamp()
        
        let security = await db.fetch(`security_${message.author.id}`)
        let coin = await db.fetch(`coin_${message.author.id}`)
        let big = await db.fetch(`big_${message.author.id}`)
        let cash = await db.fetch(`cash_${message.author.id}`)
        let userPremium = await db.fetch(`userpremium_${message.author.id}`)
        let serverPremium = await db.fetch(`serverpremium_${message.guild.id}`)
        
  let date1 = new Date
  let day1 = date1.getDate()
  let month1 = date1.getMonth()+2
  let year1 = date1.getFullYear()
  let month2 = date1.getMonth()+1
  let year2 = date1.getFullYear()+1
  if(month2 === 12) premiumTime = `${day1}-1-${year2}`;
  else if (month2 !== 12) premiumTime = `${day1}-${month1}-${year1}`;
        
        function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
let promocode = makeid(10)
let channel1231 = client.channels.cache.get('748878657723957319')
  
        if(item === "security") { 
            if(security === true) return message.channel.send('You already have an active rob protection!')
            if(cash < 3000) return message.channel.send('You dont have enough money in cash to buy this item!')
            message.channel.send(securityEmbed)
            db.subtract('cash_' + message.author.id, 3000)
            db.set('security_' + message.author.id, true) 
        } else if(item === "mysterious box") { 
            if(cash < 5000) return message.channel.send('You dont have enough money in cash to buy this item!')
            let chance1 = Math.round(Math.random() * 1000)
            db.set('ggggg_' + message.author.id, chance1)
            let chance = await db.fetch(`ggggg_${message.author.id}`)
            if(chance <= 1) {
                message.channel.send(mysteriousEmbedRedeem)
                db.add('redeem_' + message.author.id, 1)
            } else {
                message.channel.send(mysteriousEmbedMoney)
                db.add('cash_' + message.author.id, money)
            } 
            db.subtract('cash_' + message.author.id, 5000)
        } else if(item === "redeem") {
            if(cash < 20000) return message.channel.send('You dont have enough money in cash  to buy this item!')
            message.channel.send(redeemEmbed)
            db.add('redeem_' + message.author.id, 1) 
            db.subtract('cash_' + message.author.id, 20000)
        } else if(item === "alfred coin") {
            if(coin === true) return message.channel.send('You already have an alfred coin!') 
            if(cash < 900000) return message.channel.send('You dont have enough money in cash to buy this item!')
            message.channel.send(coinEmbed)
            db.set('coin_' + message.author.id, true) 
            db.subtract('cash_' + message.author.id, 900000)
        } else if(item === "big money") {
            if(big === true) return message.channel.send('You already have big money!')
            if(cash < 500000) return message.channel.send('You dont have enough money in cash to buy this item!')
            message.channel.send(bigEmbed)
            db.set('big_' + message.author.id, true) 
            db.subtract('cash_' + message.author.id, 500000)
        } else if(item === "user premium") {
            if(userPremium === true) return message.channel.send('You are already a premium member.')
            if(cash < 1000000) return message.channel.send('You dont have enough money is cash to buy this item.')
            message.channel.send(userpremiumEmbed)
            db.subtract('cash_' + message.author.id, 1000000)
            db.set('userpremiumtime_' + message.author.id, null)
            await db.set('userpremium_' + message.author.id, true)
            await db.set('userpremiumtime_' + message.author.id, premiumTime)
        } else if(item === "user promocode premium") {
            if(cash < 1000000) return message.channel.send('You dont have enough money is cash to buy this item.')
            message.channel.send(userpromocodeEmbed)
            db.subtract('cash_' + message.author.id, 1000000)
            db.add('lengthuserpromo_', 1)
            let length = await db.fetch('lengthuserpromo_')
            db.set('userpromocode_' + length, promocode)
            await db.set('userpromocodetime_' + promocode, premiumTime)
            client.users.cache.get(message.author.id).send(`Your promocode is '${promocode}'. The promocode is case sensitive.`)
            channel1231.send(message.author.id + ` generated user promocode '${promocode}' in ` + message.guild.id + ".")
        } else if(item === "server premium") {
            if(serverPremium === true) return message.channel.send('This is already a premium server.')
            if(cash < 1000000) return message.channel.send('You dont have enough money is cash to buy this item.')
            message.channel.send(serverpremiumEmbed)
            db.subtract('cash_' + message.author.id, 1000000)
            db.set('serverpremiumtime_' + message.guild.id, null)
            await db.set('serverpremium_' + message.guild.id, true)
            await db.set('serverpremiumtime_' + message.guild.id, premiumTime)
        } else if(item === "server promocode premium") {
            if(cash < 1000000) return message.channel.send('You dont have enough money is cash to buy this item.')
            message.channel.send(serverpromocodeEmbed)
            db.subtract('cash_' + message.author.id, 1000000)
            db.add('lengthserverpromo_', 1)
            let length = await db.fetch('lengthserverpromo_')
            db.set('serverpromocode_' + length, promocode)
            await db.set('serverpromocodetime_' + promocode, premiumTime)
            client.users.cache.get(message.author.id).send(`Your promocode is '${promocode}'. The promocode is case sensitive.`)
            channel1231.send(message.author.id + ` generated server promocode '${promocode}' in ` + message.guild.id + ".")
        } else {
            return;
        }
        
    }
}