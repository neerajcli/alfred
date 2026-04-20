module.exports = {
    name: "approve-order",
    description: "Approve an order",
    execute: async (client, message, args) => {
        const db = client.db;
        if (message.author.id !== '504635146553524234') return message.channel.send('Only bot devs can use this command')
        if (message.channel.id !== '966681651927220254') return message.channel.send('Please use command in orders channel')
        if (!args[0]) return message.channel.send('Please provide user id whose order you want to approve')
        let orderActive = await db.get('activeorder_' + args[0])
        if (orderActive !== true) return message.channel.send("This user doesn't have any active order.")
        const user = client.users.cache.get(args[0])
        if (!user) return message.channel.send('Invalid user')
        await db.delete('activeorder_' + args[0])
        function makeid(length) {
            var result = '';
            var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            for (var i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        }
        let promocode = makeid(10)
        let date1 = new Date
        let day1 = date1.getDate()
        let month1 = date1.getMonth() + 2
        let year1 = date1.getFullYear()
        let month2 = date1.getMonth() + 1
        let year2 = date1.getFullYear() + 1
        if (month2 === 12) premiumTime = `${day1}-1-${year2}`;
        else if (month2 !== 12) premiumTime = `${day1}-${month1}-${year1}`;
        let orderItem = await db.get('orderitem_' + args[0])
        if (orderItem === 'redeem') {
            await db.add('redeem_' + args[0], 1)
            user.send('Your order for redeem is approved!')
            message.channel.send(`You have approved the redeem order of ${args[0]}`)
        } else if (orderItem === 'alfred coin') {
            await db.set('coin_' + args[0], true)
            user.send('Your order for alfred coin is approved.')
            message.channel.send(`You have approved the alfred coin order of ${args[0]}`)
        } else if (orderItem === 'big money') {
            await db.set('big_' + args[0], true)
            user.send('Your order for big money is approved')
            message.channel.send(`You have approved the big money order of ${args[0]}`)
        } else if (orderItem === 'user promocode premium') {
            await db.add('lengthuserpromo_', 1)
            let length = await db.get('lengthuserpromo_')
            await db.set('userpromocode_' + length, promocode)
            await db.set('userpromocodetime_' + promocode, premiumTime)
            user.send(`Your order for user promocode premium is approved. Your promocode is '${promocode}' whose validity is one month starting from now irrespective of claim date. It is case sensitive. Use 'a!userpromoclaim <promocode>' to claim.`)
            message.channel.send(`You have approved the user promocode premium order of ${args[0]}, the generated promocode is '${promocode}' which is valid for one month starting from today.`)
        } else if (orderItem === 'server promocode premium') {
            await db.add('lengthserverpromo_', 1)

            let length = await db.get('lengthserverpromo_')

            await db.set('serverpromocode_' + length, promocode)

            await db.set('serverpromocodetime_' + promocode, premiumTime)

            try {

                await user.send(`Your order for server promocode premium is approved. Your promocode is '${promocode}' whose validity is one month starting from now irrespective of claim date. It is case sensitive. Use 'a!serverpromoclaim <promocode>' to claim.`)
            } catch (err) {
                console.log(err);
                message.channel.send("Failed to send dm to user");
            }

            message.channel.send(`You have approved the server promocode premium order of ${args[0]}, the generated promocode is '${promocode}' which is valid for one month starting from today.`)
        } else {
            return;
        }
        await db.delete('orderitem_' + message.author.id)
        await db.delete('orderprice_' + message.author.id)
    }
}