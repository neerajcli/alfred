module.exports = {
    name: 'report-bug',
    description: "Report a bug that u found in bot.",
    category: 'Other',
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        const channel = client.channels.cache.get('750667085625032795')
        let reported = args.slice(0).join(" ")
        if(!reported) return message.channel.send('Please specify the bug which u want to report.')
        const discord = require('discord.js')
        const embed = new discord.MessageEmbed()
        .setTitle('New Bug Report')
        .addField('Report :-', reported)
        .addField('Reported by :-', `${message.author.tag}`)
        .setColor('#FFFFFF')
        .setTimestamp()
        channel.send(embed)
        message.channel.send('Your report has been sent to the developers.')
    }
    }