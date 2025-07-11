const db = require('quick.db')
module.exports = {
  name: "verify-votekick",
  description: "Approve the votekick if someone got 5 of them",
  usage: "<userid>",
  execute: async (client, message, args) => {
      let isPremium = await db.fetch('serverpremium_' + message.guild.id)
      if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
      if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
      const Discord = require('discord.js')
     if(message.author.bot) return; 
     if(!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('Only admins can use this command.')
     const logs = await db.fetch(`mode_${message.guild.id}`)
     if (logs !== true) return message.channel.send('Mod logs should be enabled to use this command.')
     const enable = await db.fetch(`modcd_${message.guild.id}`)
     if (enable !== true) return message.channel.send('Mod logs channel should be set to use this command.')
      const user = message.guild.members.cache.get(args[0])
      if(!user) return message.channel.send('Please provide a valid user id') 
      if(args[0] === message.author.id) return message.channel.send('You cant kick yourself. Please wait for some other admin.')
      let we = await db.fetch(`votekick_${message.guild.id}${args[0]}`) 
      if (we === 5) {
          const embed1 = new Discord.MessageEmbed()
          .setTitle('Votekick Approved')
          .setDescription("Votekicks against <@" + args[0] + "> has been approved and the user has been kicked")
          .setColor('#FFFFFF')
          message.channel.send(embed1) 
          db.set("votekick_" + message.guild.id + args[0], null) 
          try {
      user.send(`Your were voted to be kicked from ${message.guild.name} and it has been approved by ${message.author.tag}. You are kicked.`).then(() => 
      {
          member.kick()
      })
      } catch (err) {
          consol.log(err).then(() => 
      {
          member.kick()
      })
      } 
      const wc = await db.fetch(`modc_${message.guild.id}`)
       const channel = message.guild.channels.cache.get(wc)
       if(!channel) return message.channel.send('Log channel not found.') 
           const logembed = new Discord.MessageEmbed()
       .setTitle('Votekick Approved')
       .addField('Username', user.user.username)
       .addField('User ID', args[0]) 
       .addField('Administrator', '<@' + message.author.id + '>')
       .setColor('#FFFFFF')
       .setTimestamp()
       channel.send(logembed)
      }
      else {
          message.channel.send('The user doesnt have enough votekicks')
      }
  
  }
}