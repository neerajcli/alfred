module.exports = {
  name: "shrug",
  category: "Fun",
  description: "Shrug at something.",
  execute: async (client, message, args) => {
    const axios = require('axios');
    const Discord = client.discord;
    const { data } = await axios.get('https://nekos.best/api/v2/shrug')
    const embed = new Discord.MessageEmbed()
      .setTitle(`${message.author.tag} shrugs!`)
      .setImage(data.results[0].url)
      .setColor('#FFFFFF')
      .setTimestamp()
    message.channel.send(embed)
  }
}