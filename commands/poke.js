module.exports = {
  name: "poke",
  category: "Fun",
  descritption: "Poke the person you want",
  execute: async (client, message, args) => {
    const axios = require('axios');
    const Discord = client.discord;
    const user = message.mentions.users.first();
    if (!user) return message.channel.send("🚫 Please Mention a Person to poke! 🚫")
    if (message.author.id === user.id) return message.channel.send(`${message.author.username}, Looks Like you need friends to poke you..  sad  :/`)
    const { data } = await axios.get('https://nekos.best/api/v2/poke')
    var strong = `${message.author.username} pokes ${user.username}
${user.username} got poked by ${message.author.username}`
    let werds = strong.split("\n")
    let hug = werds[Math.floor(Math.random() * werds.length)]
    const embed = new Discord.MessageEmbed()
      .setTitle(`${hug}`)
      .setImage(data.results[0].url)
      .setColor("#FFFFFF")
      .setTimestamp()
      .setFooter(`${message.author.tag}`, message.author.avatarURL())
    message.channel.send(embed)
  }
}