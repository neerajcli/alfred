module.exports = {
    name: "captcha-off",
    category: "Verify",
    desription: "Turn off captcha verification for your server",
    execute: async (client, message, args) => {
        const db = client.db;
        const Discord = client.discord;
        if (message.author.bot) return;
        if (!message.member.hasPermission('MANAGE_CHANNELS')) return message.channel.send('You cant do this.')
        let we = await db.get(`captchae_${message.guild.id}`)
        if (we !== true) return message.channel.send('Catcha verification system is not enabled.')
        await db.set("captchae_" + message.guild.id, false)
        const embed = new Discord.MessageEmbed()
            .setTitle('Captcha system')
            .setDescription('Disabled captcha system in this server.')
            .setColor('#FFFFFF')
        message.channel.send(embed)
    }
}
