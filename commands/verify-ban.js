module.exports = {
    name: "verify-ban",
    description: "Verify ban report against a user",
    usage: "<userid>",
    execute: async (client, message, args) => {
        const db = client.db;
        const Discord = client.discord;
        let isPremium = await db.get('serverpremium_' + message.guild.id)
        if (isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
        if (message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
        if (message.author.bot) return;
        if (!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('Only admins can do this.')
        const logs = await db.get(`mode_${message.guild.id}`)
        if (logs !== true) return message.channel.send('Mod logs should be enabled to use this command.')
        const enable = await db.get(`modcd_${message.guild.id}`)
        if (enable !== true) return message.channel.send('Mod logs channel should be set to use this command.')
        const user = message.guild.members.cache.get(args[0])
        if (!user) return message.channel.send('Please provide a valid user id')
        const voted = await db.get(`banr_${message.guild.id}${args[0]}`)
        if (voted !== true) return message.channel.send('There is no ban report against that member.')
        if (args[0] === message.author.id) return message.channel.send('You cant verify your ban report, please wait for some other admin.')
        const embed = new Discord.MessageEmbed()
            .setTitle('Ban report Accepted')
            .setDescription(`Report to ban ` + user.user.username + ` has been accepted by <@` + message.author.id + `> and the person has been banned.`)
            .setColor('#FFFFFF')
        message.channel.send(embed)
        const channel1 = await db.get(`modc_${message.guild.id}`)
        const channel = message.guild.channels.cache.get(channel1)
        if (!channel) return message.channel.send("Modlogs channel not found");
        const embed1 = new Discord.MessageEmbed()
            .setTitle('Ban report Accepted')
            .addField('Username', user.user.username)
            .addField('User ID', args[0])
            .addField('Administrator', '<@' + message.author.id + '>')
            .setColor('#FFFFFF')
        const a = await db.get(`moderator_${message.guild.id}${args[0]}`)
        const b = message.guild.members.cache.get(a)
        let ban = 0;
        try {
            await user.ban();
            message.channel.send(embed)
            channel.send(embed1)
            ban = 1;
            await db.delete("moderator_" + message.guild.id + args[0])
            await db.set("banr_" + message.guild.id + args[0], false)
        } catch (err) {
            console.log(err).then(() => {
                message.channel.send("Failed to ban, make sure i have enough permissions");
            })
        }

        if (ban == 1) {
            try {
                await user.send(`Ban report against you in ${message.guild.name} has been accepted by ${message.author.tag} and you are banned.`)
            } catch (err) {
                console.log(err)
            }
        }
        try {
            b.send(`Ban report given by you in ${message.guild.name} to ban ` + user.user.username + ` has been accepted by ${message.author.tag}.`)
        } catch (err) {
            console.log(err)
        }
    }
}