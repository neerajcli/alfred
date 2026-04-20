module.exports = {
    name: "captcha-ver",
    category: "Verify",
    description: 'Verify using captcha',
    execute: async (client, message, args) => {
        if (message.author.bot) return;

        const db = client.db;
        const Discord = client.discord;
        let we = await db.get(`captchae_${message.guild.id}`)
        if (we !== true) return message.channel.send('Captcha system is not enabled')
        const wse = await db.get(`captchare_${message.guild.id}`)
        if (wse !== true) return message.channel.send('Captcha role is not set.')
        const role = await db.get(`captchar_${message.guild.id}`)
        const verified = await db.get(`verified_${message.guild.id}${message.author.id}`)
        if (verified === true) return message.channel.send('You have already verified once.')
        const captcha = await db.get(`captcha_${message.guild.id}${message.author.id}`)
        if (args[0] !== captcha) return message.channel.send('Invalid code')
        const user = message.guild.members.cache.get(message.author.id)
        const embed = new Discord.MessageEmbed()
            .setTitle('Verified')
            .setDescription('You have successufully verified.')
            .setColor('#FFFFFF')
            .setTimestamp()
        message.channel.send(embed)
        user.roles.add(role);
        await db.delete("captcha_" + message.guild.id + message.author.id)
        await db.set("verified_" + message.guild.id + message.author.id, true)
    }
}