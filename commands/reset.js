module.exports = {
    name: "reset",
    description: "Reset someone",
    execute: async (client,message,args) => { 
        const db = require ('quick.db')
        if(message.author.id !== '504635146553524234') return message.channel.send('Only bot devs can use this command')
        if(!args[0]) return message.channel.send('Please provide user id to reset!')
               let d = db.all()

              .map(entry => entry.ID)

              .filter(id => id.includes(args[0]))

              d.forEach(db.delete)
                 message.channel.send(`Successfully reset user with id ${args[0]}.`)
    }
                }