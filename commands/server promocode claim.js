module.exports = {
  name: "serverpromoclaim",
  description: "Claim Premium Server Promocode",
  category: "Other",
  execute: async (client, message, args) => {
    const db = client.db;
    let isPremium = await db.get('serverpremium_' + message.guild.id)
    if (isPremium === true) return message.channel.send('This server already has premium.')
    if (!args[0]) return message.channel.send('Please specify the promocode')
    if (args[0] === null) return message.channel.send('Invalid Promocode')
    let promocodeLength = await db.get('lengthserverpromo_')
    let z = 1
    while (z <= promocodeLength) {
      let promocode = await db.get('serverpromocode_' + z)
      if (args[0] === promocode) {
        await db.set('serverclaimmessage_' + message.guild.id, true)
        await db.delete('serverpromocode_' + z)
        await db.set('serverpremium_' + message.guild.id, true)
      }
      z++;
    }
    let message1 = await db.get('serverclaimmessage_' + message.guild.id)
    if (message1 === true) {
      await db.delete('serverpremiumtime_' + message.guild.id)
      message.channel.send('Successufully claimed promocode.')
      let serverTime = await db.get('serverpromocodetime_' + args[0])
      await db.set('serverclaimmessage_' + message.guild.id, false)
      await db.set('serverpremiumtime_' + message.guild.id, serverTime)

    } else {
      message.channel.send('Invalid Promocode.')
    }
  }
}