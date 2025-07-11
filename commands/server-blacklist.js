module.exports = {
  name: "server-blacklist",
  aliases: ["sbl"],
  description: "Blacklists a server from using the bot.",
  usage: "<serverid>",
  execute: async (client, message, args) => { 
      const db = require('quick.db')
let owners = [
      "504635146553524234",
    ];
    if (!owners.includes(message.author.id)) {
      return message.channel.send(`Only the bot-devs can run this command!`);
    }
    let guild = client.guilds.cache.get(args[0])
if (!guild) return message.channel.send('Provide a guild id to blacklist')
 let time = args[1]
    if(!time) return message.channel.send('Please specify time or type Never')
    let clone = args.slice(2).join(" ")
   if(!clone) return message.channel.send('Please provide a reason!')
   let reason = clone
    db.set('blguildtime_' + guild.id, time)
    db.set('blguildreason_' + guild.id, reason)
db.set("blguild_" + guild.id, true)

message.channel.send(`Successfully blacklisted ${guild.name} which expires on ${time} for ${reason}.`)

}

}
