module.exports = {
    name: 'say',
    category: 'Fun',
    description: 'Make the bot say anything you want',
    execute: async (client, message, args) => {
        if(message.guild.id === '735615909884067930') return message.channel.send('Disabled for this guild')
        if(message.author.bot) return;
        if(message.content.includes('@')) return message.channel.send('You cant mention in this command')
        const toSay = args.slice(0).join(" ")
        if(!toSay) return message.channel.send('Please provide something to say')
        message.channel.send(toSay)
    }
}