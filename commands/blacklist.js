module.exports = {
  name: "blacklist",
  aliases: ["bl"],
  description: "Blacklists a user from using the bot.",
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
    if (!user) return message.channel.send('Provide a user to blacklist')
    let time = args[1]
    if(!time) return message.channel.send('Please specify time or type Never')
    let clone = args.slice(2).join(" ")
   if(!clone) return message.channel.send('Please provide a reason!')
   let reason = clone
    db.set('bltime_' + user.id, time)
    db.set('blreason_' + user.id, reason)
if (owners.includes(user.id)) return message.channel.send("I can't blacklist my owner") 
db.set("bl_" + user.id, true)

message.channel.send(`Successfully blacklisted ${user.username} which expires on ${time} for ${reason}.`)

}

}
