module.exports = {

    name: 'create-ticket',

    category: 'Server Premium',

    description: 'Create a ticket.',

    execute: async (client, message, args) => {

        const db = require('quick.db')

        if(message.author.bot) return;

      let isPremium = await db.fetch('serverpremium_' + message.guild.id)

if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
        
        let ticketNumber = await db.fetch('ticketnumber_' + message.guild.id)
        if(ticketNumber === null) db.set('ticketnumber_' + message.guild.id, 0)
        
        let everyoneRole = message.guild.roles.cache.find(r => r.name === '@everyone')
        let moderatorRole = message.guild.roles.cache.find(r1 => r1.name.toLowerCase() === 'moderator')
        if(!moderatorRole) return message.channel.send("Your server needs to have a role named 'Moderator' to use tickets.")
        let pending = await db.fetch('ticketpending_' + message.author.id + message.guild.id)
        let pendingId = db.fetch('ticketchannelid_' + message.author.id + message.guild.id)
        if(pending === true) return message.channel.send(`You already have an opened ticket <#${pendingId}>, please ask your query there.`)
        await db.add('ticketnumber_' + message.guild.id, 1)
        let newTicketNumber = await db.fetch('ticketnumber_' + message.guild.id)
   message.guild.channels.create(`ticket${newTicketNumber}`, {
            type: "text",
            permissionOverwrites: [
                {
                    id: everyoneRole.id,
                    deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                }, 
                {
                    id: message.author.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                },
                {
                    id: moderatorRole.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                }
            ],
        }).then(async () => {
        let cid1 = await message.guild.channels.cache.find(c => c.name === `ticket${newTicketNumber}`)
        await db.set('ticketchannel_' + cid1.id, true)
        message.channel.send(`Created your ticket <#${cid1.id}>`)
       cid1.send(`Hello <@${message.author.id}>!\n\nThanks for creating a ticket!\n\nPlease write down your problem in this channel. Our moderator team will be there to assist you very soon.`)
       await db.set('ticketuserid_' + cid1.id, message.author.id)
       await db.set('ticketchannelid_' + message.author.id + message.guild.id, cid1.id)
       })
        await db.set('ticketpending_' + message.author.id + message.guild.id, true)
   
        
        
        }
    }