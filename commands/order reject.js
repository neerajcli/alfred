module.exports = {
    name: "reject-order",
    description: "Reject an order",
    execute: async (client, message, args) => {
        const db = client.db;
        if (message.author.id !== '504635146553524234') return message.channel.send('Only bot devs can use this command')
        if (message.channel.id !== '966681651927220254') return message.channel.send('Please use command in orders channel')
        if (!args[0]) return message.channel.send('Please provide user id whose order you want to reject')
        let orderActive = await db.get('activeorder_' + args[0])
        if (orderActive !== true) return message.channel.send("This user doesn't have any active order.")
        const user = client.users.cache.get(args[0])
        if (!user) return message.channel.send('Invalid user')
        await db.delete('activeorder_' + args[0])
        let orderPrice = await db.get('orderprice_' + args[0])
        await db.add('cash_' + args[0], orderPrice)
        let item = await db.get('orderitem_' + message.author.id)
        try {
            await user.send(`Your order for ${item} has been rejected. Your money is refunded.`)
        } catch (err) {
            console.log(err);
            message.channel.send("Failed to send dm to user");
        }
        message.channel.send(`You have rejected ${item} order of ${args[0]}.`)
        await db.delete('orderitem_' + message.author.id)
        await db.delete('orderprice_' + message.author.id)
    }
}