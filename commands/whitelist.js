const { QuickDB } = require("quick.db")
const db = new QuickDB();
module.exports = {
  name: "whitelist",
  aliases: ["wl"],
  description: "Whitelists a user from using the bot.",
  usage: "<@user>",
  execute: async (client, message, args) => { 

let owners = [
      "504635146553524234",
    ];
    if (!owners.includes(message.author.id)) {
      return message.channel.send(`Only the bot-devs can run this command!`);
    }
    let user = client.users.cache.get(args[0])
if(!user) return;

await db.delete("bl_" + user.id)
await db.delete('blreason_' + user.id)
await db.delete('bltime_' + user.id)

message.channel.send(`Successfully whitelisted ${user.username}`)

}
}
