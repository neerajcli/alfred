module.exports = {
    name: 'poll',
    description: 'Have a poll for something.',
    category: 'Fun',
    execute: async (client, message, args) => {
        if (message.author.bot) return;
        if (!message.member.hasPermission('MANAGE_CHANNELS')) return message.channel.send('You cant do this')
        const channel1 = message.mentions.channels.first()
        if (!channel1) return message.channel.send('Correct format is `a!poll <#channel> <poll>`.')
        const channel = message.guild.channels.cache.get(channel1.id)
        const poll = args.slice(1).join(' ')
        if (!poll) return message.channel.send('For what are you polling?')
        const Discord = client.discord;
        const embed = new Discord.MessageEmbed()
            .setTitle('New poll')
            .setDescription(poll)
            .setColor('#FFFFFF')
            .setFooter(`Started by ${message.author.tag}. In favour - 👍  Against - 👎`)
        const o = await channel.send(embed)
        await o.react("👍")
        await o.react("👎")
        message.channel.send('Done')
    }
}