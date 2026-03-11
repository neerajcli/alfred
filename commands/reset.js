const { QuickDB } = require("quick.db")
const db = new QuickDB();
module.exports = {
  name: "reset",
  description: "Reset someone",
  execute: async (client,message,args) => { 

      if(message.author.id !== '504635146553524234') return message.channel.send('Only bot devs can use this command')
      if(!args[0]) return message.channel.send('Please provide user id to reset!')
             let d = await db.all()

            let keys = d.map(entry => entry.id)

            .filter(id => id.includes(args[0]))

            for (const key of keys) {
              await db.delete(key);
            }
               message.channel.send(`Successfully reset user with id ${args[0]}.`)
  }
              }