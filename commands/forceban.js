module.exports = {
  name: "forceban",
  category: "Moderation",
  aliases: ["fban"],
  description: "Bans a user directly.",
  usage: "<user> (reason)",
  execute: async (client, message, args) => {
    const db = client.db;
    const Discord = client.discord;
    if (message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
    if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send('Only admins can force ban.')
    if (message.author.bot) return;
    const user = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!user) return message.channel.send('Please mention someone to Ban')
    if (user.id === message.author.id) return message.channel.send('You cant ban youself')
    if (user.hasPermission("ADMINISTRATOR"))
      return message.channel.send(
        "You can't ban an admin.")
    if (user.id === '670234327749099521') return message.channel.send('I cant ban myself')
    const member = message.guild.members.cache.get(user.id)
    let reason = args.slice(1).join(" ");
    if (!reason) reason = "NO reason provided.";
    let we = await db.get(`mode_${message.guild.id}`)
    if (we === true) {
      let wd = await db.get(`modcd_${message.guild.id}`)
      if (wd !== true) return message.channel.send('Cant do the event. Mod channel not set, kindly set one by doing "a!set-logs-channel <#channel>".')
      const wc = await db.get(`modc_${message.guild.id}`)
      const channel = message.guild.channels.cache.get(wc)
      if (!channel) return message.channel.send('Log channel not found.')
      const logembed = new Discord.MessageEmbed()
        .setTitle('Member Banned')
        .addField('Username', member.user.username)
        .addField('User ID', member.user.id)
        .addField('Reason', `${reason}`)
        .addField('Moderator', '<@' + message.author.id + '>')
        .setColor('#FFFFFF')
        .setTimestamp()
      channel.send(logembed)
    }
    let ban = 0;
    const embed = new Discord.MessageEmbed()
      .setTitle('Banned')
      .setDescription(`${message.mentions.users.first().username} has been banned by ${message.author.tag}.`)

    try {
      await member.ban()
      message.channel.send(embed)
      ban = 1;
    } catch (err) {
      consol.log(err).then(() => {
        message.channel.send("An error occured, make sure i have enough permissions")
      })
    }
    if (ban == 1) {
      try {
        await member.send(`You were banned from ${message.guild.name} by ${message.author.tag} for ${reason}.`)
      } catch (err) {
        console.log(err)
      }
    }
  }
}