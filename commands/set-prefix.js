module.exports = {
    name: "set-prefix",
    category: "Other",
    description: "Change prefix of bot for your server",
    execute: async (client, message, args) => {
    const db = require('quick.db')
    if(!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send('You cant do this');
    db.set('prefix_' + message.guild.id, args[0])
    message.channel.send('Changed server prefix to `' + args[0] + '` .')
    }
    
    
}