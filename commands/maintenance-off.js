const Discord = require('discord.js')
const { QuickDB } = require("quick.db")
const db = new QuickDB();
module.exports = {
  name: "maintenance-off",
  description: "Stops bot's maintenance",
  execute: async (client, message, args) => { 

let owners = [
      "504635146553524234",
    ];
    if (!owners.includes(message.author.id)) {
      return message.channel.send(`Only the bot-devs can run this command!`);
    }
await db.delete("maintenance_")
await db.delete("maintenancetime_")
const embed = new Discord.MessageEmbed()
.setTitle('Maintenance Ended')
.setDescription("Stopped bot's maintenance.")
.setColor('#FFFFFF')
message.channel.send(embed)

}

}