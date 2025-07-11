module.exports = {
    name: "pat",
    category: "Fun",
    descritption: "Pat the person you want",
    execute: async (client, message, args) => {
        const Discord = require ('discord.js')
let superagent = require("superagent")
const db = require("quick.db")
  const user = message.mentions.users.first();
  if(!user) return message.channel.send("🚫 Please Mention a Person to pat! 🚫")
  if(message.author.id === user.id) return message.channel.send(`${message.author.username}, Looks Like you need friends..  sad  :/`)
  let { body } = await superagent.get("https://nekos.life/api/pat") 
 
  var strong = `${message.author.username} pats ${user.username}
${user.username} got a pat from ${message.author.username}`
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