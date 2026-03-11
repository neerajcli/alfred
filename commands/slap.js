const Discord = require ('discord.js')
let superagent = require("superagent")
const { QuickDB } = require("quick.db")
const db = new QuickDB();
module.exports = {
    name: "slap",
    category: "Fun",
    descritption: "Slap the person you want",
    execute: async (client, message, args) => {

  const user = message.mentions.users.first();
  if(!user) return message.channel.send("🚫 Please Mention a Person to slap! 🚫")
  if(message.author.id === user.id) return message.channel.send(`${message.author.username}, Lets not do this  :/`)
  let { body } = await superagent.get("https://nekos.life/api/v2/img/slap") 
 await db.add('slaps_' + message.author.id + user.id, 1)
 let slapsno = await db.get('slaps_' + message.author.id + user.id)
  var strong = `${message.author.username} slaps ${user.username}
${user.username} got a slap from ${message.author.username}`
  let werds = strong.split("\n")
  let hug = werds[Math.floor(Math.random()*werds.length)]
  const embed = new Discord.MessageEmbed()
  .setTitle(`${hug}`)
  .setImage(body.url)
  .setColor("#FFFFFF")
  .setFooter(`There are ${slapsno} slaps now!`)
  message.channel.send(embed)

    }
}