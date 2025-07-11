const db = require('quick.db')
module.exports = {
  name: "ban",
  category: "Server Premium",
  description: "Sends report to ban a user",
  usage: "<@user> (reason)",
  execute: async (client, message, args) => {
      const Discord = require('discord.js')
     if(message.author.bot) return;
      
     
      let isPremium = await db.fetch('serverpremium_' + message.guild.id)
      if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
      
      if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
     if(!message.member.hasPermission('BAN_MEMBERS')) return message.channel.send('You cant do this.')
     const logs = await db.fetch(`mode_${message.guild.id}`)
     if (logs !== true) return message.channel.send('Mod logs should be enabled to use this command.')
     const enable = await db.fetch(`modcd_${message.guild.id}`)
     if (enable !== true) return message.channel.send('Mod logs channel should be set to use this command.')
      const user = message.mentions.members.first() || message.guild.members.cache.get(args[0])
      if(!user) return message.channel.send('Please mention someone to ban') 
      const voted = await db.fetch(`banr_${message.guild.id}${user.id}`)
      if(voted === true) return message.channel.send('There is already a ban report against that user.')
      if(user.id === message.author.id) return message.channel.send('You cant report to ban urself')
      if(user.id === '670234327749099521') return message.channel.send('I cant ban myself')
       if (user.hasPermission("ADMINISTRATOR"))
      return message.channel.send(
        "You cant report to ban an admin.")
      const member = message.guild.members.cache.get(user.id) 
       let reason = args.slice(1).join(" ");
    if (!reason) return message.channel.send('Please provide a reason') 
    db.set("moderator_" + message.guild.id + user.id, message.author.id)
    db.set("banr_" + message.guild.id + user.id, true)
      const embed = new Discord.MessageEmbed() 
      .setTitle('Ban report')
      .setDescription(`Ban report recieved to ban ${message.mentions.users.first().username} for ${reason}.`) 
      .setColor('#FFFFFF')
      message.channel.send(embed)
      try {
      member.send(`Ban report recieved against you ${message.guild.name} by ${message.author.tag} for ${reason}.`)
      } catch (err) {
          console.log(err)
      } 
      const a = message.guild.members.cache.get(message.author.id)
       try {
      a.send(`Your ban report from ${message.guild.name} to ban ${message.mentions.users.first().username} for ${reason} has been recieved and is waiting for approval.`)
      } catch (err) {
          console.log(err)
      } 
          const channel1 = await db.fetch(`modc_${message.guild.id}`)
          const channel = message.guild.channels.cache.get(channel1)
          if(!channel) return message.channel.send('Mod channel not found')
          const embed1 = new Discord.MessageEmbed()
          .setTitle('Ban report')
          .setDescription('<@' + user.id + '> has got a ban report for ' + `${reason}` + " from <@" + message.author.id + "> Kindly do 'a!verify-ban " + user.id +  "' to verify ban report and ban the user or do 'a!reject-ban " + user.id + " <reason>(optional)' to reject the ban.")
          .setColor('#FFFFFF')
          channel.send(embed1)
  
  }
}