const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "userpromogenerate",
    description: "Generate Premium User Promocode",
    execute: async (client, message, args) => {
        if(message.author.id !== "504635146553524234") return message.channel.send('Only bot-devs can use this command')
if(!args[0]) return message.channel.send('Please specify premium time or type Permanent.')
function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
let promocode = makeid(10)
db.add('lengthuserpromo_', 1)
let length = await db.fetch('lengthuserpromo_')
db.set('userpromocode_' + length, promocode)
db.set('userpromocodetime_' + promocode, args[0])
message.channel.send("The generated promocode is '" + promocode + "'. This promocode expires on " + args[0] + '.')
        }
    }