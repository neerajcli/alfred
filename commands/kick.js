module.exports = {
  name: "kick",
  category: "Moderation",
  aliases: ["kickuser"],
  description: "Kicks a user.",
  usage: "<user> (reason)",
  execute: async (client, message, args) => {
      if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
      const Discord = require('discord.js')
      if(!message.member.hasPermission("KICK_MEMBERS")) return message.channel.send('You cant do this')
      if(message.author.bot === true) return;
      const user = message.mentions.members.first()
      if(!user) return message.channel.send('Please mention someone to kick') 
      if(user.id === message.author.id) return message.channel.send('You cant kick youself')
       if (user.hasPermission("ADMINISTRATOR"))
      return message.channel.send(
        "You can't kick an admin.")
      if(user.id === '670234327749099521') return message.channel.send('I cant kick myself')
      const member = message.guild.members.cache.get(user.id) 
       let reason = args.slice(1).join(" ");
    if (!reason) reason = "NO reason provided."; 
     const db = require('quick.db')
   let we = await db.fetch(`mode_${message.guild.id}`)
if (we === true) { 
       let wd = await db.fetch(`modcd_${message.guild.id}`)
       if (wd !== true) return message.channel.send('Cant do the event. Mod channel not set, kindly set one by doing "a!set-logs-channel <#channel>".')
       const wc = await db.fetch(`modc_${message.guild.id}`)
       const channel = message.guild.channels.cache.get(wc)
       if(!channel) return message.channel.send('Log channel not found.') 
       const discord = require('discord.js')
       const logembed = new discord.MessageEmbed()
       .setTitle('Member Kicked')
       .addField('Username', member.user.username)
       .addField('User ID', member.user.id) 
       .addField('Reason', `${reason}`)
       .addField('Moderator', '<@' + message.author.id + '>')
       .setColor('#FFFFFF')
       .setTimestamp()
       channel.send(logembed) 
}
      const embed = new Discord.MessageEmbed() 
      .setTitle('Kicked')
      .setDescription(`${message.mentions.users.first().username} has been kicked by ${message.author.tag}.`) 
      message.channel.send(embed)
      try {
      member.send(`You were kicked from ${message.guild.name} by ${message.author.tag} for ${reason}.`).then(() => {
          member.kick()
      })
      } catch (err) {
          consol.log(err).then(() => {
          member.kick()
      })
      }
  }
}