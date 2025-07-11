module.exports = {
  name: "server-whitelist",
  aliases: ["swl"],
  description: "Whitelists a server from using the bot.",
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
if (!guild) return message.channel.send('Provide a guild id to whitelist')
db.set("blguild_" + guild.id, null)
    db.set('blguildtime_' + guild.id, null)
           db.set('blguildreason_' + guild.id, null)

message.channel.send(`Successfully whitelisted ${guild.name}`)

}

}
