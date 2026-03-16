const { QuickDB } = require('quick.db');
const db = new QuickDB();
const Discord = require('discord.js');

module.exports = {
    name: "reset-pass",
    description: "Reset your bank password",
    category: "Economy",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        function makeid(length) {
            var result = '';
            var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            for(var i=0; i<length;i++) {
                result+=characters.charAt(Math.floor(Math.random()*charactersLength));
            }
            return result;
        }
        let pass = makeid(12);
        await db.set('econpass_'+message.author.id,pass);
        message.author.send("Your updated bank password is " + pass);
        const embed = new Discord.MessageEmbed()
        .setTitle("Password Reset")
        .setDescription("Your updated password is sent to your dms. Please keep it safe.")
        .setColor("#FFFFFF")
        .setTimestamp()
        .setFooter("Make sure your dms are enabled");
        message.channel.send(embed);
    }
}