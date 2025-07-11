const Discord = require("discord.js");
const db = require('quick.db')
module.exports = {
  name: "warnings",
  category: "Moderation",
  aliases: ["checkwarns"],
  description: "Check no. of warns someone has",
  usage: "<user>",
  execute: async (client, message, args) => {
      if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
      if(message.author.bot) return;
      if(!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.sed('You cant do this')
      let user = message.mentions.members.first() || message.author
      let warnings = db.get('warn_' + message.guild.id + user.id)
      if (warnings === null) return message.channel.send('<@' + user.id + '> has 0 warns!')
      message.channel.send('<@' + user.id + '> has ' + warnings + ' warns!')
  }
}