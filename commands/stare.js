module.exports = {
    name: "stare",
    category: "Fun",
    description: "Stare at someone.",
    execute: async (client, message, args) => {
        const axios = require('axios');
        const Discord = client.discord;
        const { data } = await axios.get('https://nekos.best/api/v2/stare')
        const user = message.mentions.users.first();
        if (!user) return message.channel.send("🚫 Please Mention a Person to stare at! 🚫")
        if (message.author.id === user.id) return message.channel.send(`${message.author.username}, Lets not do this  :/`)
        const embed = new Discord.MessageEmbed()
            .setTitle(`${message.author.username} stares at ${user.username}`)
            .setImage(data.results[0].url)
            .setColor('#FFFFFF')
            .setTimestamp()
        message.channel.send(embed)
    }
}