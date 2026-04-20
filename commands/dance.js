module.exports = {
  name: "dance",
  category: "Fun",
  description: "You are dancing.",
  execute: async (client, message, args) => {
    const axios = require('axios');
    const Discord = client.discord;
    const { data } = await axios.get('https://nekos.best/api/v2/dance')
    const embed = new Discord.MessageEmbed()
      .setTitle(`${message.author.tag} is dancing!`)
      .setImage(data.results[0].url)
      .setColor('#FFFFFF')
      .setTimestamp()
    message.channel.send(embed)
  }
}