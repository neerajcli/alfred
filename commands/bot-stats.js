const { MessageEmbed } = require("discord.js");
const ms = require("ms");
module.exports = {
  name: "bot-stats",
  description: "Get the detailed information about bot.",
  category: "Other",
  execute(client, message, args) {
      if (message.author.id !== "504635146553524234") return message.channel.send("Permanently disabled due to no access to 'PRESENCE' privileged intent.")
    let embed = new MessageEmbed()
      .setColor('#FFFFFF')
      .setThumbnail(client.user.displayAvatarURL())
      .setAuthor(`Stats and Info`, client.user.displayAvatarURL())
      .addField("Servers", client.guilds.cache.size, true)
      .addField("Presence", client.user.presence.activities[0].name, true)
      .addField("ID", client.user.id, true)
      .addField('Library', 'discord.js v.12x', true)
      .addField("Uptime", ms(client.uptime), true)
      .addField("Status", client.user.presence.status, true)
      .addField("Total Users", client.users.cache.size, true)
      .addField("Developers", `${require('../config.json').developers.join('\n')}`)
      .setFooter(`Requested By: ${message.author.tag}`)
      .setTimestamp();
    console.log(client.user.presence);
    message.channel.send(embed);
  }
};