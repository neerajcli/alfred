let axios = require("axios")
module.exports = {
  name: "baka",
  category: "Fun",
  descritption: "Say baka to the person you want",
  execute: async (client, message, args) => {
    const Discord = client.discord;
    const user = message.mentions.users.first();
    if (!user) return message.channel.send("🚫 Please Mention a Person to say baka to! 🚫")
    if (message.author.id === user.id) return message.channel.send(`${message.author.username}, Dont do this  :/`)
    let { data } = await axios.get("https://nekos.best/api/v2/baka")

    var strong = `${message.author.username} baka's ${user.username}
${user.username} is baka by ${message.author.username}`
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