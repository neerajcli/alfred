const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: 'bal',
    category: "Economy",
    description: "Know your current balance",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        const user = message.mentions.users.first() || message.author
        let cash = await db.fetch(`cash_${user.id}`)
        let bank = await db.fetch(`bank_${user.id}`)
    let ws = await db.fetch(`cash_${user.id}`)
if (ws = null) db.set('cash_' + user.id, 0);
let wp = await db.fetch(`bank_${user.id}`)
if (wp = null) db.set('bank_' + user.id, 0);

if(cash === null)
cash = 0;

if (bank === null) 
bank = 0;

        let networth = db.add('cash_' + user.id, bank) 
        let networth1 = db.subtract('cash_' + user.id, bank)
         if (networth === null) {
            networth = 0
        } 
        if(user.id === '670234327749099521') {
            cash = 'Infinity'
            bank = 'Infinity'
            networth = 'Infinity'
            }
        let coin = await db.fetch(`coin_${user.id}`)
        if (coin === null) coin = "Not Owned";
        if(coin === true) coin = "Owned"
        let isPremium = await db.fetch('userpremium_' + user.id)
        if (isPremium === null) isPremium = "N";
        else if (isPremium === true) isPremium = "Yes";
     
        let timeHelp = await db.fetch('userpremium_' + user.id)
       let premiumTime = await db.fetch('userpremiumtime_' + user.id)
       let time1 = await db.fetch('userpremiumtime_' + user.id)
   if(premiumTime === 'Permanent' && timeHelp === true) premiumTime = ' - Permanent'
  else if(premiumTime !== 'Permanent' && timeHelp !== true) premiumTime = 'o'
  else if(premiumTime === 'Permanent' && timeHelp !== true) premiumTime = 'o'
  else if(premiumTime !== 'Permanent' && timeHelp === true) premiumTime = ` till ${time1}`
                                       
        const embed = new Discord.MessageEmbed()
        .setTitle("Balance of " + user.username)
        .setColor("#FFFFFF")
        .setFooter(`Requested by ${message.author.tag}`)
        .addField('Cash', "$" + cash)
        .addField('Bank', "$" + bank)
        .addField('Networth', "$" + networth)
        .addField('Alfred Coin', coin)
        .addField('Premium Member', isPremium + premiumTime)
        message.channel.send(embed) 
    }
}