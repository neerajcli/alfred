module.exports = {
  name: "maintenance-off",
  description: "Stops bot's maintenance",
  execute: async (client, message, args) => { 
      const Discord = require('discord.js')
      const db = require('quick.db')
let owners = [
      "504635146553524234",
    ];
    if (!owners.includes(message.author.id)) {
      return message.channel.send(`Only the bot-devs can run this command!`);
    }
db.set("maintenance_", null)
db.set("maintenancetime_", null)
const embed = new Discord.MessageEmbed()
.setTitle('Maintenance Ended')
.setDescription("Stopped bot's maintenance.")
.setColor('#FFFFFF')
message.channel.send(embed)

}

}