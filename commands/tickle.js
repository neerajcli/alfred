module.exports = {
    name: "tickle",
    category: "Fun",
    descritption: "Tickle the person you want",
    execute: async (client, message, args) => {
        const Discord = require ('discord.js')
let superagent = require("superagent")
const db = require("quick.db")
  const user = message.mentions.users.first();
  if(!user) return message.channel.send("🚫 Please Mention a Person to tickle! 🚫")
  if(message.author.id === user.id) return message.channel.send(`${message.author.username}, Looks Like you need friends to tickle you..  sad  :/`)
  let { body } = await superagent.get("https://nekos.life//api/v2/img/tickle") 
 
  var strong = `${message.author.username} tickles ${user.username}
${user.username} got tickled from ${message.author.username}`
  let werds = strong.split("\n")
  let hug = werds[Math.floor(Math.random()*werds.length)]
  const embed = new Discord.MessageEmbed()
  .setTitle(`${hug}`)
  .setImage(body.url)
  .setColor("#FFFFFF")
  .setTimestamp()
  .setFooter(`${message.author.tag}`, message.author.avatarURL())
  message.channel.send(embed)

    }
}