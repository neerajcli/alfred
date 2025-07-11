const Discord = require('discord.js')
module.exports = {
    name: "shutdown",
    description: "Shuts Down the bot.",
    execute: async (client, message, args) => {
        let owners = [
            "504635146553524234",
        ]
    if (!owners.includes(message.author.id)) return;
        message.channel.send('Shutting Down....').then(() => {
            client.destroy()
            })
        }
    }
                                     
   