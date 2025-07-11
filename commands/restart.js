const Discord = require('discord.js')
module.exports = {
    name: "restart",
    description: "Restarts the bot.",
    execute: async (client, message, args) => {
        let owners = [
            "504635146553524234",
        ]
    if (!owners.includes(message.author.id)) return;
        message.channel.send('Restarting....').then(() => {
            process.exit()
            })
        }
    }
                                     
   