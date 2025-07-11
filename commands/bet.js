const db = require ('quick.db')
const ms = require ('parse-ms')
const Discord = require('discord.js')
module.exports = {
    name: 'bet',
    category: 'User Premium',
    description: 'Bet your money!',
    execute: async (client, message, args) => {
        let isPremium = await db.fetch('userpremium_' + message.author.id)
        if(isPremium !== true) return message.channel.send('Only premium members can use this command')
        if(!args[0]) return message.channel.send('Please specify amount to bet with')
        let cash = await db.fetch('cash_' + message.author.id)
        if(isNaN(args[0]) === true) return message.channel.send('Invalid Amount.')
        if(args[0] <= '0') return message.channel.send("You can't bet nothing")
        if (args[0] > cash) return message.channel.send("You can't bet more than you have in cash")
        let chance = Math.round(Math.random()*10)
        
        let timeout = 1800000
  let bet = await db.fetch(`bet_${message.author.id}`);
if (bet !== null && timeout - (Date.now() - bet) > 0) {
    let time = ms(timeout - (Date.now() - bet));
  let timeEmbed = new Discord.MessageEmbed()
    .setColor("#FFFFFF") 
    .setTitle("Cooldown")
    .setDescription(`You need to wait ${time.minutes}m ${time.seconds}s to use this command again.`);
    message.channel.send(timeEmbed)
  } else { 
      if(chance <= 4) {
         message.channel.send(`Congrats you won ${args[0]}`)
          db.add('cash_' + message.author.id, args[0])
          } else {
             message.channel.send('You lost the bet, better luck next time.')
              db.subtract('cash_' + message.author.id, args[0])
              }
db.set('bet_' + message.author.id, Date.now())
      }
        
        }
    }