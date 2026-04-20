module.exports = {
    name: "giveredeem",
    category: "Economy",
    description: "Give some of your redeems to another person!",
    execute: async (client, message, args) => {
        const db = client.db;
        const Discord = client.discord;
        if (message.author.bot) return;
        const authorpass = await db.get('econpass_' + message.author.id);
        if (authorpass == null) return message.channel.send("Please create your bank password using `a!reset-pass` to use this command");
        const user = message.mentions.users.first() || client.users.cache.get(args[0])
        if (!user) return message.channel.send('Invalid user!')
        if (user.id === message.author.id) return message.channel.send('You cant give yourself redeems!')
        const toGive = args[1]
        const giver = await db.get(`redeem_${message.author.id}`)
        if (giver === null) await db.set('redeem_' + message.author.id, 0)
        if (isNaN(args[1]) === true) return message.channel.send('Invalid Amount')
        if (toGive > giver) return message.channel.send('You dont have enough redeems to give!')
        if (toGive <= 0) return message.channel.send('You cant give 0 or less redeem!')
        await db.sub('redeem_' + message.author.id, args[1])
        await db.add('redeem_' + user.id, args[1])
        const embed = new Discord.MessageEmbed()
            .setTimestamp()
            .setColor('#FFFFFF')
            .setTitle("Giveredeem")
            .setDescription('You gave ' + user.username + " " + toGive + " redeems! The person has recieved your payment!")
        message.channel.send(embed)
    }
}