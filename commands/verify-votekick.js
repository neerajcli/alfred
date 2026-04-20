module.exports = {
    name: "verify-votekick",
    description: "Approve the votekick if someone got 5 of them",
    usage: "<userid>",
    execute: async (client, message, args) => {
        const db = client.db;
        const Discord = client.discord;
        let isPremium = await db.get('serverpremium_' + message.guild.id)
        if (isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
        if (message.guild.id === "568902211980099605") return message.channel.send('Mod commands are disabled')
        if (message.author.bot) return;
        if (!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('Only admins can use this command.')
        const logs = await db.get(`mode_${message.guild.id}`)
        if (logs !== true) return message.channel.send('Mod logs should be enabled to use this command.')
        const enable = await db.get(`modcd_${message.guild.id}`)
        if (enable !== true) return message.channel.send('Mod logs channel should be set to use this command.')
        const user = message.guild.members.cache.get(args[0])
        if (!user) return message.channel.send('Please provide a valid user id')
        if (args[0] === message.author.id) return message.channel.send('You cant kick yourself. Please wait for some other admin.')
        let we = await db.get(`votekick_${message.guild.id}${args[0]}`)
        if (we === 5) {
            let kick = 0;
            const embed1 = new Discord.MessageEmbed()
                .setTitle('Votekick Approved')
                .setDescription("Votekicks against <@" + args[0] + "> has been approved and the user has been kicked")
                .setColor('#FFFFFF')
            const wc = await db.get(`modc_${message.guild.id}`)
            const channel = message.guild.channels.cache.get(wc)
            if (!channel) return message.channel.send("Modlogs channel not found");
            const logembed = new Discord.MessageEmbed()
                .setTitle('Votekick Approved')
                .addField('Username', user.user.username)
                .addField('User ID', args[0])
                .addField('Administrator', '<@' + message.author.id + '>')
                .setColor('#FFFFFF')
                .setTimestamp()
            try {
                await member.kick();
                await db.delete("votekick_" + message.guild.id + args[0])
                message.channel.send(embed);
                kick = 1;
                channel.send(logembed)
            } catch (err) {
                console.log(err).then(() => {
                    message.channel.send("Failed to kick, make sure i have enough permissions");
                })
            }
            if (kick == 1) {
                try {
                    await user.send(`Your were voted to be kicked from ${message.guild.name} and it has been approved by ${message.author.tag}. You are kicked.`);
                } catch (err) {
                    console.log(err)
                }
            }
        }
        else {
            message.channel.send('The user doesnt have enough votekicks')
        }

    }
}