module.exports = {
    name: 'close-ticket',
    category: 'Server Premium',
    description: 'Close a ticket.',
    execute: async (client, message, args) => {
        const db = require('quick.db')
        if(message.author.bot) return;
      let isPremium = await db.fetch('serverpremium_' + message.guild.id)
if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
      if(!message.member.hasPermission("MANAGE_CHANNELS") || !message.member.hasPermission("ADMINISTRATOR")) return message.channel.send('You cant do this. You need manage channels perm.')
        let isTicketChannel = await db.fetch('ticketchannel_' + message.channel.id)
        if(isTicketChannel !== true) return message.channel.send('This channel is not a ticket channel.')
       await db.set('ticketchannel_' + message.channel.id, false)
      let ticketOwner = await db.fetch('ticketuserid_' + message.channel.id)
      await db.set('ticketpending_' + ticketOwner + message.guild.id, null)
        await db.set('ticketchannelid_' + ticketOwner + message.guild.id, null)
        message.channel.delete()
        }
    }
   