const Discord = require('discord.js')
const { QuickDB } = require("quick.db")
      const db = new QuickDB();
module.exports = {
    name: "dep",
    category: "Economy",
    description: "Deposit your money in the bank!",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        let cash = await db.get(`cash_${message.author.id}`);
        if(cash === null) await db.set('cash_' + message.author.id, 0);
        let bank = await db.get(`bank_${message.author.id}`);
         if(bank === null) await db.set('bank_' + message.author.id, 0);
         let toDeposit = args[0] 
         if(toDeposit === "all") toDeposit = cash;
         const o = isNaN(toDeposit)
         if(o !== false) return message.channel.send("Format is `a!dep <amount> or all`!");
         if(toDeposit <= 0) return message.channel.send('You cant deposit 0 or less.');
         if(toDeposit > cash) return message.channel.send('You cant deposit more than you have.');
         await db.add('bank_' + message.author.id, toDeposit)
         await db.sub('cash_' + message.author.id, toDeposit)
         const embed = new Discord.MessageEmbed()
         .setTitle("Deposit")
         .setColor('#FFFFFF')
         .setTimestamp()
         .setDescription("You have deposited $" + toDeposit + " in your bank!")
         message.channel.send(embed)
    }
}