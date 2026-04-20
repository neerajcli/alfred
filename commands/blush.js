module.exports = {
  name: "blush",
  category: "Fun",
  description: "Blush at something.",
  execute: async (client, message, args) => {
    const axios = require('axios');
    const Discord = client.discord;
    const { data } = await axios.get('https://nekos.best/api/v2/blush')

    const embed = new Discord.MessageEmbed()
      .setTitle(`${message.author.tag} blushes!`)
      .setImage(data.results[0].url)
      .setColor('#FFFFFF')
      .setTimestamp()
    message.channel.send(embed)
  }
}