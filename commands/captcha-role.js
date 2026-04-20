module.exports = {
    name: 'set-captcha-role',
    description: "Set a captcha role to given when someone verifies.",
    execute: async (client, message, args) => {
        if (message.author.bot) return;

        if (!message.member.hasPermission('MANAGE_CHANNELS')) return message.channel.send('You cant do this')
        const db = client.db;
        const Discord = client.discord;
        const we = await db.get(`captchae_${message.guild.id}`)
        if (we !== true) return message.channel.send('Captcha system is not enabled.')
        const role = message.mentions.roles.first();
        if (!role) return message.channel.send('Please mention a valid role!')
        await db.set("captchar_" + message.guild.id, role.id)
        await db.set("captchare_" + message.guild.id, true)
        const embed = new Discord.MessageEmbed()
            .setTitle('Captcha Role')
            .setDescription('Captcha role has been set to <@&' + role.id + '>.')
            .setColor('#FFFFFF')
        message.channel.send(embed)
    }
}