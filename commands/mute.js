const discord = require("discord.js");

module.exports = {
  name: "mute",
  category: "Moderation",
  aliases: ["muteuser"],
  description: "Mute a user.",
  usage: "<user> (reason)",
  execute: async (client, message, args) => {
      if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
    if (!message.member.hasPermission("MANAGE_ROLES"))
      return message.channel.send(
        "You need manage roles permission to use this."
      );

    let role = message.guild.roles.cache.find(rl => rl.name === "Muted");
    if (!role) { 
        message.guild.roles.create({
  data: {
    name: 'Muted',
}}
)
}
    let user = message.mentions.members.first();
    if (!user) return message.channel.send("Mention a user.");
const member = message.guild.members.cache.get(user.id)
if(member.roles.cache.has(role.id)) return message.channel.send('This user is already muted')
if(user.id === message.author.id) return message.channel.send('You cant mute yourself')
      if(user.id === '670234327749099521') return message.channel.send('I cant mute myself')
    let reason = args.slice(1).join(" ");
    if (!reason) reason = "NO reason provided.";

    if (user.hasPermission("ADMINISTRATOR"))
      return message.channel.send(
        "You can't mute an admin."
      ); 
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
       .setTitle('Member Muted')
       .addField('Username', member.user.username)
       .addField('User ID', member.user.id) 
       .addField('Reason', `${reason}`)
       .addField('Moderator', '<@' + message.author.id + '>')
       .setColor('#FFFFFF')
       .setTimestamp()
       channel.send(logembed) 
}

    try {
      user.send(
        `You have been muted in ${message.guild.name} by ${message.author.tag} for ${reason}`
      );
    } catch (err) {
      console.log(err);
    }

    await user.roles.add(role);
    message.channel.send(`${user} is muted.`);
  }
};