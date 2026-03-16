const Discord = require('discord.js')
const { QuickDB } = require("quick.db")
      const db = new QuickDB();
module.exports = {
    name: "redeem",
    category: "Economy",
    description: "Check yours or someone's redeems!",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        const authorpass = await db.get('econpass_' + message.author.id);
        if(authorpass == null) return message.channel.send("Please create your bank password using `+reset-pass` to use this command");
        const user = message.mentions.users.first() || message.author
        let redeem = await db.get(`redeem_${user.id}`)
        if(redeem === null) await db.set('redeem_' + user.id, 0); 
        if(redeem === null) redeem = 0;
        const embed = new Discord.MessageEmbed()
        .setTitle(user.username + "'s Redeems : " + redeem + " 💸")
        .setDescription('Redeems are a special type of currency that can be used to get either 20000$ or you can gift them to someone.')
        .addField('a!useredeem', "Use your redeem and get 20000$!")
        .addField('a!giveredeem', "Give some of your redeems to someone!")
        .setColor('#FFFFFF')
        .setFooter(`Requested by ${message.author.tag}! Buy redeems from shop or donate using a!donate to get them, 1$ = 2 redeems.`)
        message.channel.send(embed)
    }
    
}