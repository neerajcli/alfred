module.exports = {
    name: "poke",
    category: "Fun",
    descritption: "Poke the person you want",
    execute: async (client, message, args) => {
        const Discord = require ('discord.js')
const db = require("quick.db")
  const user = message.mentions.users.first();
  if(!user) return message.channel.send("🚫 Please Mention a Person to poke! 🚫")
  if(message.author.id === user.id) return message.channel.send(`${message.author.username}, Looks Like you need friends to poke you..  sad  :/`)
 function lpad(value, padding) {

    var zeroes = new Array(padding+1).join("0");

    return (zeroes + value).slice(-padding);
     }
     const number = Math.round(Math.random() * 21)
  var strong = `${message.author.username} pokes ${user.username}
${user.username} got poked by ${message.author.username}`
  let werds = strong.split("\n")
  let hug = werds[Math.floor(Math.random()*werds.length)]
  const embed = new Discord.MessageEmbed()
  .setTitle(`${hug}`)
  .setImage("https://nekos.best/api/v2/poke/" + lpad(number, 3) + ".gif")
  .setColor("#FFFFFF")
  .setTimestamp()
  .setFooter(`${message.author.tag}`, message.author.avatarURL())
  message.channel.send(embed)
    }
}