const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "order",
    category: "User Premium",
    description: "Order something in your own rate.",
    execute: async (client, message, args) => {
        let isPremium = await db.fetch('userpremium_' + message.author.id)
        if(isPremium !== true) return message.channel.send('Only premium members can use this command')
        if(isNaN(args[0])) return message.channel.send('Invalid Price. Correct format is `a!order <price> <item name>`!')
        if(args[0] <= '0') return message.channel.send("You can't place order for 0$")
        let item1 = args.slice(1).join(' ')
        let item = item1.toLowerCase()
        let responses = ["redeem", "alfred coin", "big money", "user promocode premium", "server promocode premium"]
        if(!responses.includes(item)) return message.channel.send('Invalid Item Provided. Correct format `a!order <price> <item name>`!')
  let orderActive = await db.fetch('activeorder_' + message.author.id)
        if(orderActive === true) return message.channel.send('You already have an active order please wait for that order to be accepted or rejected before placing another order.')
        let cash = await db.fetch('cash_' + message.author.id)
        if(args[0] > cash) return message.channel.send("Your price can't be greater than your cash.")
        function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
        let orderid = makeid(7)
        db.set('orderitem_' + message.author.id, item)
        db.set('orderprice_' + message.author.id, args[0])
        message.channel.send('Your order is placed and your order id is `' + orderid + '`, keep it safe for future reference, your cash will be refunded if your order is rejected. Make sure your dms are on as you will be informed about your order status through dms within 7 days, if you dont get to know your order status within 7 days please use `a!support`.')
        db.subtract('cash_' + message.author.id, args[0])
        db.set('activeorder_' + message.author.id, true)
        let channel127373 = client.channels.cache.get('966681651927220254')
        const embed = new Discord.MessageEmbed()
        .setTitle('New Order')
        .addField('Customer Name:', message.author.username, true)
        .addField('Customer ID:', message.author.id, true)
        .addField('Order ID:', orderid, true)
        .addField('Order Item:', item, true)
        .addField('Price:', args[0], true)
        .setColor('#FFFFF')
        .setTimestamp()
        channel127373.send('<@504635146553524234>, Please use `a!approve-order <customer id>` to approve or `a!reject-order <customer id>` to reject.',embed)
        }
    }