const db = require('quick.db')
module.exports = {
    name: "dm",
    category: "User Premium",
    description: "DM anyone anything you want.",
    execute: async(client, message, args) => {
        if(message.author.bot) return;
        let isPremium = await db.fetch('userpremium_' + message.author.id)
        if(isPremium !== true) return message.channel.send('Only premium members can use this command.')
        const toDm = message.mentions.members.first()
        if(!toDm) return message.channel.send('User not found. Correct format is `a!dm @user <dm message>`.')
        if(toDm.id === message.author.id) return message.channel.send('You cant dm yourself!')
        const dmed = args.slice(1).join(' ')
        if(!dmed) return message.channel.send('What you want to dm?')
        try {
            toDm.send(dmed + `\n\nFrom user id - ${message.author.id}\nFrom server id - ${message.guild.id}`).then(() => { message.channel.send('Done!')})
        } catch(err) {
            console.log(err).then(() => {message.channel.send('An error occured. Make sure the reciever has dms open.')})
        }
    }
}