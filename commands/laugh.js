module.exports = {
  name: "laugh",
  category: "Fun",
  description: "Laugh on something.",
  execute: async (client, message, args) => {
    const axios = require('axios');
    const Discord = client.discord;
    const { data } = await axios.get('https://nekos.best/api/v2/laugh')
    const embed = new Discord.MessageEmbed()
      .setTitle(`${message.author.tag} is laughing!`)
      .setImage(data.results[0].url)
      .setColor('#FFFFFF')
      .setTimestamp()
    message.channel.send(embed)
  }
}