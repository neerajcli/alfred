module.exports = {
    name: "claim-bigmoney",
    description: "Get your 1000$ if you own bigmoney!",
    execute: async (client, message, args) => {
        const ms = require('parse-ms')
        const db = client.db;
        const Discord = client.discord;
        if (message.author.bot) return;
        const authorpass = await db.get('econpass_' + message.author.id);
        if (authorpass == null) return message.channel.send("Please create your bank password using `a!reset-pass` to use this command");
        let big = await db.get(`big_${message.author.id}`)
        if (big === true) {
            let timeout = 3600000
            let work = await db.get(`bigmo_${message.author.id}`);
            if (work !== null && timeout - (Date.now() - work) > 0) {
                let time = ms(timeout - (Date.now() - work));
                let timeEmbed = new Discord.MessageEmbed()
                    .setColor("#FFFFFF")
                    .setTitle("Cooldown")
                    .setDescription(`You need to wait ${time.hours}h ${time.minutes}m ${time.seconds}s to use this command again.`);
                message.channel.send(timeEmbed)
            } else {
                let ws = await db.get(`cash_${message.author.id}`)
                if (ws = null) await db.set('cash_' + message.author.id, 0)
                const embed = new Discord.MessageEmbed()
                    .setTitle("BigMoney Claim")
                    .setDescription('You have claimed your big money reward and have been given $1000. Use this after 1 hour to claim it again!')
                    .setColor('#FFFFFF')
                    .setTimestamp()
                message.channel.send(embed)
                await db.set(`bigmo_${message.author.id}`, Date.now())
                await db.add("cash_" + message.author.id, 1000)
            }
        } else {
            const embed1 = new Discord.MessageEmbed()
                .setTitle('Error')
                .setColor('#FFFFFF')
                .setTimestamp()
                .setDescription('You dont have big money. Kindly buy the item from shop and then retry!')
            message.channel.send(embed1)
        }
    }
}