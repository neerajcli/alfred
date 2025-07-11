module.exports = {
  name: "whitelist",
  aliases: ["wl"],
  description: "Whitelists a user from using the bot.",
  usage: "<@user>",
  execute: async (client, message, args) => { 
      const db = require('quick.db')
let owners = [
      "504635146553524234",
    ];
    if (!owners.includes(message.author.id)) {
      return message.channel.send(`Only the bot-devs can run this command!`);
    }
    let user = client.users.cache.get(args[0])
if(!user) return;

db.set("bl_" + user.id, null)
db.set('blreason_' + user.id, null)
db.set('bltime_' + user.id, null)

message.channel.send(`Successfully whitelisted ${user.username}`)

}
}
