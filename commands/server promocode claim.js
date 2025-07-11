const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "serverpromoclaim",
    description: "Claim Premium Server Promocode",
    category: "Other",
    execute: async (client, message, args) => {
        let isPremium = await db.fetch('serverpremium_' + message.guild.id)
        if(isPremium === true) return message.channel.send('This server already has premium.')
if(!args[0]) return message.channel.send('Please specify the promocode')
if(args[0] === null) return message.channel.send('Invalid Promocode')
let promocodeLength = db.fetch('lengthserverpromo_')
let z = 1
while(z <= promocodeLength) {
  let promocode = db.fetch('serverpromocode_' + z)
  if(args[0] === promocode) {
   db.set('serverclaimmessage_' + message.guild.id, true)
   db.set('serverpromocode_' + z, null)
   db.set('serverpremium_' + message.guild.id, true)
  }
  z++;
}
let message1 = await db.fetch('serverclaimmessage_' + message.guild.id)
if(message1 === true) {
    db.set('serverpremiumtime_' + message.guild.id, null)
  message.channel.send('Successufully claimed promocode.')
    let serverTime = await db.fetch('serverpromocodetime_' + args[0])
    await db.set('serverclaimmessage_' + message.guild.id, false)
    await db.set('serverpremiumtime_' + message.guild.id, serverTime)
  
} else {
  message.channel.send('Invalid Promocode.')
}
        }
    }