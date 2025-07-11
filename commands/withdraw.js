const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "with",
    category: "Economy",
    description: "Withdraw your money from the bank!",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        let cash = await db.fetch(`cash_${message.author.id}`);
        if(cash === null) db.set('cash_' + message.author.id, 0);
        let bank = await db.fetch(`bank_${message.author.id}`);
         if(bank === null) db.set('bank_' + message.author.id, 0);
         let toDeposit = args[0] 
         if(toDeposit === "all") toDeposit = bank;
         const o = isNaN(toDeposit)
         if(o !== false) return message.channel.send("Format is `a!with <amount> or all`!");
         if(toDeposit <= 0) return message.channel.send('You cant withdraw 0 or less.');
         if(toDeposit > bank) return message.channel.send('You cant withdraw more than you have.');
         db.subtract('bank_' + message.author.id, toDeposit)
         db.add('cash_' + message.author.id, toDeposit)
         const embed = new Discord.MessageEmbed()
         .setTitle("Withdraw")
         .setColor('#FFFFFF')
         .setTimestamp()
         .setDescription("You have withdrawn $" + toDeposit + " from your bank!")
         message.channel.send(embed)
    }
}