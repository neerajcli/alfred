module.exports = {
  name: "cry",
  category: "Fun",
  description: "Cry for something.",
  execute: async (client, message, args) => {
    const axios = require('axios');
    const Discord = client.discord;
    const { data } = await axios.get('https://nekos.best/api/v2/cry')
    const embed = new Discord.MessageEmbed()
      .setTitle(`${message.author.tag} cries!`)
      .setImage(data.results[0].url)
      .setColor('#FFFFFF')
      .setTimestamp()
    message.channel.send(embed)
  }
}