const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "userpromoclaim",
    description: "Claim Premium User Promocode",
    category: "Other",
    execute: async (client, message, args) => {
        let isPremium = await db.fetch('userpremium_' + message.author.id)
        if(isPremium === true) return message.channel.send('You are already a premium member.')
        if(!args[0]) return message.channel.send('Please specify the promocode')
if(args[0] === null) return message.channel.send('Invalid Promocode')
let promocodeLength = db.fetch('lengthuserpromo_')
let z = 1
while(z <= promocodeLength) {
  let promocode = db.fetch('userpromocode_' + z)
  if(args[0] === promocode) {
   db.set('userclaimmessage_' + message.author.id, true)
   db.set('userpromocode_' + z, null)
   db.set('userpremium_' + message.author.id, true)
  }
  z++;
}
let message1 = await db.fetch('userclaimmessage_' + message.author.id)
if(message1 === true) {
    db.set('userpremiumtime_' + message.author.id, null)
  message.channel.send('Successufully claimed promocode.')
    let userTime = await db.fetch('userpromocodetime_' + args[0])
    await  db.set('userclaimmessage_' + message.author.id, false)
    await db.set('userpremiumtime_' + message.author.id, userTime)
 
} else {
  message.channel.send('Invalid Promocode.')
}
        }
    }