const { QuickDB } = require("quick.db")
const db = new QuickDB();
module.exports = {
    name: "userpromoclaim",
    description: "Claim Premium User Promocode",
    category: "Other",
    execute: async (client, message, args) => {
        let isPremium = await db.get('userpremium_' + message.author.id)
        if(isPremium === true) return message.channel.send('You are already a premium member.')
        if(!args[0]) return message.channel.send('Please specify the promocode')
if(args[0] === null) return message.channel.send('Invalid Promocode')
let promocodeLength = await db.get('lengthuserpromo_')
let z = 1
while(z <= promocodeLength) {
  let promocode = await db.get('userpromocode_' + z)
  if(args[0] === promocode) {
   await db.set('userclaimmessage_' + message.author.id, true)
   await db.delete('userpromocode_' + z)
   await db.set('userpremium_' + message.author.id, true)
  }
  z++;
}
let message1 = await db.get('userclaimmessage_' + message.author.id)
if(message1 === true) {
    await db.delete('userpremiumtime_' + message.author.id)
  message.channel.send('Successufully claimed promocode.')
    let userTime = await db.get('userpromocodetime_' + args[0])
    await  db.set('userclaimmessage_' + message.author.id, false)
    await db.set('userpremiumtime_' + message.author.id, userTime)
 
} else {
  message.channel.send('Invalid Promocode.')
}
        }
    }