let superagent = require("superagent")
module.exports = {
  name: "smug",
  category: "Fun",
  descritption: "Smug at person you want",
  execute: async (client, message, args) => {
    const Discord = client.discord;
    const user = message.mentions.users.first();
    if (!user) return message.channel.send("🚫 Please Mention a Person to smug at! 🚫")
    if (message.author.id === user.id) return message.channel.send(`${message.author.username}, Looks Like you need friends to smug at..  sad  :/`)
    let { body } = await superagent.get("https://nekos.life//api/v2/img/smug")

    var strong = `${message.author.username} smugs at ${user.username}
${user.username} got a smug from ${message.author.username}`
    let werds = strong.split("\n")
    let hug = werds[Math.floor(Math.random() * werds.length)]
    const embed = new Discord.MessageEmbed()
      .setTitle(`${hug}`)
      .setImage(body.url)
      .setColor("#FFFFFF")
      .setTimestamp()
      .setFooter(`${message.author.tag}`, message.author.avatarURL())
    message.channel.send(embed)

  }
}