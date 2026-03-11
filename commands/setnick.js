module.exports = {
    name: "set-nick",
    category: "Utility",
    description: "Change nickname of the mentioned user.",
    execute: async (client, message, args) => {
        if(message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
        if(message.author.bot) return;
        if(!message.member.hasPermission("MANAGE_NICKNAMES")) return message.channel.send('You cant do this')
        const user = message.mentions.members.first()
        if(!user) message.channel.send('Please mention someone')
        const nickname = args.slice(1).join(' ')
        if(!nickname) return message.channel.send('Invalid Nickname')
        user.setNickname(nickname);
        message.channel.send('Changed the nickname')
    }
}