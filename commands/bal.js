module.exports = {
    name: 'bal',
    category: "Economy",
    description: "Know your current balance",
    execute: async (client, message, args) => {
        const db = client.db;
        const Discord = client.discord;
        if (message.author.bot) return;
        const authorpass = await db.get('econpass_' + message.author.id);
        if (authorpass == null) return message.channel.send("Please create your bank password using `a!reset-pass` to use this command");
        const user = message.mentions.users.first() || message.author
        let cash = await db.get(`cash_${user.id}`)
        let bank = await db.get(`bank_${user.id}`)
        let ws = await db.get(`cash_${user.id}`)
        if (ws == null) await db.set('cash_' + user.id, 0);
        let wp = await db.get(`bank_${user.id}`)
        if (wp == null) await db.set('bank_' + user.id, 0);

        if (cash === null)
            cash = 0;

        if (bank === null)
            bank = 0;

        let networth = await db.add('cash_' + user.id, bank)
        await db.sub('cash_' + user.id, bank)
        if (networth === null) {
            networth = 0
        }
        if (user.id === '670234327749099521') {
            cash = 'Infinity'
            bank = 'Infinity'
            networth = 'Infinity'
        }
        let coin = await db.get(`coin_${user.id}`)
        if (coin === null) coin = "Not Owned";
        if (coin === true) coin = "Owned"
        let isPremium = await db.get('userpremium_' + user.id)
        if (isPremium === null) isPremium = "N";
        else if (isPremium === true) isPremium = "Yes";

        let timeHelp = await db.get('userpremium_' + user.id)
        let premiumTime = await db.get('userpremiumtime_' + user.id)
        let time1 = await db.get('userpremiumtime_' + user.id)
        if (premiumTime === 'Permanent' && timeHelp === true) premiumTime = ' - Permanent'
        else if (premiumTime !== 'Permanent' && timeHelp !== true) premiumTime = 'o'
        else if (premiumTime === 'Permanent' && timeHelp !== true) premiumTime = 'o'
        else if (premiumTime !== 'Permanent' && timeHelp === true) premiumTime = ` till ${time1}`

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