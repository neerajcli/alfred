module.exports = {
    name: "kiss",
    category: "Fun",
    descritption: "Kiss the person you want",
    execute: async (client, message, args) => {
        if(message.guild.id === "568902211980099605") return message.channel.send('This command is disabled')
        const Discord = require ('discord.js')
let superagent = require("superagent")
const db = require("quick.db")
  const user = message.mentions.users.first();
  if(!user) return message.channel.send("🚫 Please Mention a Person to kiss! 🚫")
  if(message.author.id === user.id) return message.channel.send(`${message.author.username}, Looks Like you are lonely..  sad  :/`)
  let { body } = await superagent.get("https://nekos.life/api/kiss") 
 
  var strong = `${message.author.username} kisses ${user.username}
${user.username} got a kiss from ${message.author.username}`
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