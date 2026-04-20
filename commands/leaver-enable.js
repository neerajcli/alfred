module.exports = {
    name: "enable-leaver",
    category: "Greet",
    description: "Enables leaver on your server.",
    execute: async (client, message, args) => {
        const db = client.db;
        const Discord = client.discord;

        if (!message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send("You can't do this!")
        let we = await db.get(`le_${message.guild.id}`)
        if (we === true) {
            return message.channel.send('Leaver messages are already enabled!')
        }
        else {
            await db.set("le_" + message.guild.id, true)
            const embed = new Discord.MessageEmbed()
                .setTitle('Leaver Message')
                .setDescription('Enabled Leaver Messages on this server! PLease set a welcomer channel by doing "a!set-leaver-channel <#channel>"!')
                .setColor('#FFFFFF')
                .setTimestamp()
            message.channel.send(embed)
        }
    }
}