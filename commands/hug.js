let superagent = require("superagent")
module.exports = {
  name: "hug",
  category: "Fun",
  descritption: "Hug the person you want",
  execute: async (client, message, args) => {
    const db = client.db;
    const Discord = client.discord;
    const user = message.mentions.users.first();
    if (!user) return message.channel.send("🚫 Please Mention a Person to hug! 🚫")
    if (message.author.id === user.id) return message.channel.send(`${message.author.username}, Looks Like you need friends to hug you..  sad  :/`)
    let { body } = await superagent.get("https://nekos.life/api/hug")
    await db.add('hugs_' + message.author.id + user.id, 1)
    let hugsno = await db.get('hugs_' + message.author.id + user.id)
    var strong = `${message.author.username} hugs ${user.username}
${user.username} got a hug from ${message.author.username}`
    let werds = strong.split("\n")
    let hug = werds[Math.floor(Math.random() * werds.length)]
    const embed = new Discord.MessageEmbed()
      .setTitle(`${hug}`)
      .setImage(body.url)
      .setColor("#FFFFFF")
      .setFooter(`There are ${hugsno} hugs now!`)
    message.channel.send(embed)

  }
}