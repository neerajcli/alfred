module.exports = {
    name: "shop",
    category: "Economy",
    description: "Official shop for alfred bot!",
    execute: async (client, message, args) => {
        const db = client.db;
        const Discord = client.discord;
        if (message.author.bot) return;
        const authorpass = await db.get('econpass_' + message.author.id);
        if (authorpass == null) return message.channel.send("Please create your bank password using `a!reset-pass` to use this command");
        const embed = new Discord.MessageEmbed()
            .setTitle("Shop")
            .setDescription('Use `a!buy-item <item name>` to buy an item and `a!item-info <item-name>` to get more information about that item!')
            .addField('Security', '**Price:** $3000')
            .addField('Mysterious Box', '**Price:** $5000')
            .addField('Redeem', '**Price:** $20000')
            .addField('Big Money', '**Price:** $500000')
            .addField('Alfred Coin', '**Price:** $900000')
            .addField('User Premium - 1 Month', '**Price:** $1000000')
            .addField('User PromoCode Premium - 1 Month', '**Price:** $1000000')
            .addField('Server Premium - 1 Month', '**Price:** $1000000')
            .addField('Server PromoCode Premium - 1 Month', '**Price:** $1000000')
            .setColor('#FFFFFF')
            .setTimestamp()
        message.channel.send(embed)
    }
}