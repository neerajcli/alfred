const db = require('quick.db')
module.exports = {
  name: "votekick",
  category: "Server Premium",
  description: "Vote to kick a user",
  usage: "<@user> (reason)",
  execute: async (client, message, args) => {
      let isPremium = await db.fetch('serverpremium_' + message.guild.id)
      if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
      if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
      const Discord = require('discord.js')
     if(message.author.bot) return; 
     const logs = await db.fetch(`mode_${message.guild.id}`)
     if (logs !== true) return message.channel.send('Mod logs should be enabled to use this command.')
     const enable = await db.fetch(`modcd_${message.guild.id}`)
     if (enable !== true) return message.channel.send('Mod logs channel should be set to use this command.')
      const user = message.mentions.members.first()
      if(!user) return message.channel.send('Please mention someone to votekick') 
      if(user.id === '670234327749099521') return message.channel.send('U cant votekick me')
      const voted = await db.fetch(`voted_${message.guild.id}${user.id}${message.author.id}`)
      if(voted === true) return message.channel.send('You have already voted to kick this user')
      if(user.id === message.author.id) return message.channel.send('You cant vote to kick youself')
       if (user.hasPermission("ADMINISTRATOR"))
      return message.channel.send(
        "You vote to kick an admin.")
      const member = message.guild.members.cache.get(user.id) 
       let reason = args.slice(1).join(" ");
    if (!reason) return message.channel.send('Please provide a reason') 
    const p = await db.fetch(`reason_${message.guild.id}${user.id}`)
    db.set("reason_" + message.guild.id + user.id, p + ` ${reason}`)
      let we = await db.fetch(`votekick_${message.guild.id}${user.id}`)
      db.set("kick_" + message.guild.id + user.id, 1)
      let wm = db.add(`kick_${message.guild.id}${user.id}`, we)
      let ws = await db.fetch(`kick_${message.guild.id}${user.id}`)
      if (ws !== 5) {
          db.add('votekick_' + message.guild.id + user.id, 1) 
          db.set("voted_" + message.guild.id + user.id + message.author.id, true)
      const embed = new Discord.MessageEmbed() 
      .setTitle('Votekick')
      .setDescription(`You voted to kick ${message.mentions.users.first().username} for ${reason}.`) 
      .setColor('#FFFFFF')
      message.channel.send(embed)
      try {
      member.send(`You were voted for being kicked from ${message.guild.name} by ${message.author.tag} for ${reason}.`)
      } catch (err) {
          consol.log(err)
      } 
      }
      else if (ws === 5) {
          db.set('votekick_' + message.guild.id + user.id, 5) 
          db.set("voted_" + message.guild.id + user.id + message.author.id, true) 
          const o = await db.fetch(`reason_${message.guild.id}${user.id}`)
          const channel1 = await db.fetch(`modc_${message.guild.id}`)
          const channel = message.guild.channels.cache.get(channel1)
          if(!channel) return message.channel.send('Mod channel not found')
          const embed1 = new Discord.MessageEmbed()
          .setTitle('5 Votekicks')
          .setDescription('<@' + user.id + '> has got 5 votekicks for the reasons ' + o + " . Kindly do 'a!verify-votekick " + user.id +  "' to verify kick and kick the user or do 'a!reject-votekick " + user.id + " <reason>(optional)' to reject the votekick. ||If it shows null in reasons too, please ignore it.||")
          .setColor('#FFFFFF')
          channel.send(embed1)
      } 
  
  }
}