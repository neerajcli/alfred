const Discord = require("discord.js"); 
const discord = require('discord.js')
module.exports = {
  name: "unban",
  category: "Moderation",
  description: "Unbans a user directly.",
  usage: "<user> (reason)",
  execute: async (client, message, args) => {
      if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
  let guild = message.guild;
  let user =
    message.mentions.users.first() ||
    message.guild.members.cache.get(args[0]) ||
      args[0];
    //client.users.cache.get(args[0]);

  if (!message.member.hasPermission("BAN_MEMBERS")) {
    return message.channel.send(
      `You Require \`BAN MEMBERS\` Permission to Execute this Command`
    );
  }

  if (!user)
    return message.channel.send("You need to Provide A Valid User ID to Unban");
let reason = args.slice(1).join(" ");
    if (!reason) reason = "NO reason provided."; 
    const banList = await message.guild.fetchBans();
const bannedUser = banList.find(member => member.id === user.id);
if (!bannedUser) return message.channel.send(`${user} is not banned.`);
  guild.members.unban(user);
  const db = require('quick.db')
 let we = await db.fetch(`mode_${message.guild.id}`)
if (we === true) { 
       let wd = await db.fetch(`modcd_${message.guild.id}`)
       if (wd !== true) return message.channel.send('Cant do the event. Mod channel not set, kindly set one by doing "a!set-logs-channel <#channel>".')
       const wc = await db.fetch(`modc_${message.guild.id}`)
       const channel = message.guild.channels.cache.get(wc)
       if(!channel) return message.channel.send('Log channel not found.') 
       const logembed = new discord.MessageEmbed()
       .setTitle('Member Unbanned')
       .addField('User', "<@" + args[0] + ">")
       .addField('User ID', args[0]) 
       .addField('Reason', `${reason}`)
       .addField('Moderator', '<@' + message.author.id + '>')
       .setColor('#FFFFFF')
       .setTimestamp()
       channel.send(logembed) 
}
  let embed = new discord.MessageEmbed()
    .setTitle("User was Successfully Unbanned")
    .setDescription(`<@${user}> was unbanned for ${reason}`)
    .setColor('#FFFFFF');
  message.channel.send(embed)


}
}