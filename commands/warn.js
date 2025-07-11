const Discord = require("discord.js");
const db = require('quick.db')
module.exports = {
  name: "warn",
  category: "Moderation",
  aliases: ["warnuser"],
  description: "Warn a user in the server.",
  usage: "<user> (reason)",
  execute: async (client, message, args) => {
      if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
      if(message.author.bot) return;
      if(!message.member.hasPermission('MANAGE_CHANNELS')) return('You cant do this')
      const user = message.mentions.members.first()
      if(!user) return message.channel.send('Please mention the person to warn') 
      if(user.id === message.author.id) return message.channel.send('You cant warn youself')
      if(user.hasPermission('ADMINISTRATOR')) return message.channel.send('You cant warn an admin')
      if(user.id === '670234327749099521') return message.channel.send('I cant warn myself')
      const member = message.guild.members.cache.get(user.id)
      db.add('warn_' + message.guild.id + user.id, 1) 
      let reason =  args.slice(1).join(" ");
    if (!reason) reason = "No reason provided."; 
   let we = await db.fetch(`mode_${message.guild.id}`)
if (we === true) { 
       let wd = await db.fetch(`modcd_${message.guild.id}`)
       if (wd !== true) return message.channel.send('Cant do the event. Mod channel not set, kindly set one by doing "a!set-logs-channel <#channel>".')
       const wc = await db.fetch(`modc_${message.guild.id}`)
       const channel = message.guild.channels.cache.get(wc)
       if(!channel) return message.channel.send('Log channel not found.') 
       const discord = require('discord.js')
       const logembed = new discord.MessageEmbed()
       .setTitle('Member Warned')
       .addField('Username', member.user.username)
       .addField('User ID', member.user.id) 
       .addField('Reason', `${reason}`)
       .addField('Moderator', '<@' + message.author.id + '>')
       .setColor('#FFFFFF')
       .setTimestamp()
       channel.send(logembed) 
}
      const embed = new Discord.MessageEmbed() 
      .setTitle('Warned')
      .setDescription(`Warned ${message.mentions.users.first().username} for ${reason}`)
      .setColor('#FFFFF') 
      message.channel.send(embed)
      try {
      member.send(`You were warned in ${message.guild.name} by ${message.author.tag} for ${reason}`);
      }
     catch (err) {
         console.log(err); 
  }
}
}