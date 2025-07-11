const Discord = require("discord.js");
const db = require('quick.db')
module.exports = {
  name: "clearwarns",
  category: "Moderation",
  aliases: ["cw"],
  description: "Clears all warns of the mentioned user",
  usage: "<user>",
  execute: async (client, message, args) => {
      if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
      if(message.author.bot) return;
      if(!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.sed('You cant do this')
      let user = message.mentions.members.first()
      if(!user) return message.channel.send('Please mention someone') 
      const member = message.guild.members.cache.get(user.id)
      let warnings = db.get('warn_' + message.guild.id + user.id)
      if (warnings === null) return message.channel.send('<@' + user.id + '> has 0 warns!') 
   let we = await db.fetch(`mode_${message.guild.id}`)
if (we === true) { 
       let wd = await db.fetch(`modcd_${message.guild.id}`)
       if (wd !== true) return message.channel.send('Cant do the event. Mod channel not set, kindly set one by doing "a!set-logs-channel <#channel>".')
       const wc = await db.fetch(`modc_${message.guild.id}`)
       const channel = message.guild.channels.cache.get(wc)
       if(!channel) return message.channel.send('Log channel not found.') 
       const discord = require('discord.js')
       const logembed = new discord.MessageEmbed()
       .setTitle('Member Warns Cleared')
       .addField('Username', member.user.username)
       .addField('User ID', member.user.id) 
       .addField('Moderator', '<@' + message.author.id + '>')
       .setColor('#FFFFFF')
       .setTimestamp()
       channel.send(logembed) 
}
      db.set('warn_' + message.guild.id + user.id, 0)
      message.channel.send('Cleared warns for <@' + user.id + ">.")
  }
}