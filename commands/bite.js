module.exports = {
    name: "bite",
    category: "Fun",
    description: "Bite someone.",
    execute: async (client, message, args) => {
        const axios = require('axios');
        const Discord = client.discord;
        const { data } = await axios.get('https://nekos.best/api/v2/bite')
        const user = message.mentions.users.first();
        if (!user) return message.channel.send("🚫 Please Mention a Person to bite! 🚫")
        if (message.author.id === user.id) return message.channel.send(`${message.author.username}, Lets not do this  :/`)

        const embed = new Discord.MessageEmbed()
            .setTitle(`${message.author.username} bites ${user.username}`)
            .setImage(data.results[0].url)
            .setColor('#FFFFFF')
            .setTimestamp()
        message.channel.send(embed)
    }
}