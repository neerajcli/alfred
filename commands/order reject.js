const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "reject-order",
    description: "Reject an order",
    execute: async (client, message, args) => {
        if(message.author.id !== '504635146553524234') return message.channel.send('Only bot devs can use this command')
        if(message.channel.id !== '966681651927220254') return message.channel.send('Please use command in orders channel')
        if(!args[0]) return message.channel.send('Please provide user id whose order you want to reject')
let orderActive = await db.fetch('activeorder_' + args[0])
if (orderActive !== true) return message.channel.send("This user doesn't have any active order.")
        const user = client.users.cache.get(args[0])
        if(!user) return message.channel.send('Invalid user')
        await db.set('activeorder_' + args[0], null)
        let orderPrice = await db.fetch('orderprice_' + args[0])
        db.add('cash_' + args[0], orderPrice)
        let item = await db.fetch('orderitem_' + message.author.id)
        user.send(`Your order for ${item} has been rejected. Your money is refunded.`)
        message.channel.send(`You have rejected ${item} order of ${args[0]}.`)
        await db.set('orderitem_' + message.author.id, null)
        await db.set('orderprice_' + message.author.id, null)
        }
    }