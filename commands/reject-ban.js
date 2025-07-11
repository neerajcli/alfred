const db = require('quick.db')
module.exports = {
  name: "reject-ban",
  description: "Reject ban report against a user",
  usage: "<userid> (optional reason)",
  execute: async (client, message, args) => {
      let isPremium = await db.fetch('serverpremium_' + message.guild.id)
      if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
      if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
      const Discord = require('discord.js')
     if(message.author.bot) return; 
     if(!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('Only admins can do this.')
     const logs = await db.fetch(`mode_${message.guild.id}`)
     if (logs !== true) return message.channel.send('Mod logs should be enabled to use this command.')
     const enable = await db.fetch(`modcd_${message.guild.id}`)
     if (enable !== true) return message.channel.send('Mod logs channel should be set to use this command.')
      const user = message.guild.members.cache.get(args[0])
      if(!user) return message.channel.send('Please provide a valid user id') 
      const voted = await db.fetch(`banr_${message.guild.id}${args[0]}`)
      if(voted !== true) return message.channel.send('There is no ban report against that member.')
      if(args[0] === message.author.id) return message.channel.send('You cant reject your ban report, please wait for some other admin.')
       let reason = args.slice(1).join(" ");
    if (!reason) reason = "No reaason provided" 
      const embed = new Discord.MessageEmbed() 
      .setTitle('Ban report rejected')
      .setDescription(`Report to ban ` +  user.user.username + ` has been rejected by <@` + message.author.id + `> for ${reason}.`) 
      .setColor('#FFFFFF')
      message.channel.send(embed)
      try {
      user.send(`Ban report against you in ${message.guild.name} has been rejected by ${message.author.tag} for ${reason}.`)
      } catch (err) {
          console.log(err)
      } 
      const a = await db.fetch(`moderator_${message.guild.id}${args[0]}`)
      const b = message.guild.members.cache.get(a)
       try {
      b.send(`Ban report given by you in ${message.guild.name} to ban ` + user.user.username + ` has been rejected by ${message.author.tag} for ${reason}.`)
      } catch (err) {
          console.log(err)
      } 
      db.set("moderator_" + message.guild.id + args[0], null)
    db.set("banr_" + message.guild.id + args[0], false)
          const channel1 = await db.fetch(`modc_${message.guild.id}`)
          const channel = message.guild.channels.cache.get(channel1)
          if(!channel) return message.channel.send('Mod channel not found')
          const embed1 = new Discord.MessageEmbed()
          .setTitle('Ban report Rejected')
          .addField('Username', user.user.username)
          .addField('User ID', args[0])
          .addField('Reason', `${reason}`)
          .addField('Administrator', '<@' + message.author.id + '>')
          .setColor('#FFFFFF')
          channel.send(embed1) 
  }
}