module.exports = {
    name: "disable-leaver",
    category: "Greet",
    description: "Disables leaver on your server.",
    execute: async (client, message, args) => {
        const db = client.db;
        const Discord = client.discord;

        if (!message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send("You can't do this!")
        let we = await db.get(`le_${message.guild.id}`)
        if (we !== true) {
            return message.channel.send('Leaver messages are not enabled!')
        }
        else {
            await db.set("le_" + message.guild.id, false)
            const embed = new Discord.MessageEmbed()
                .setTitle(' Leaver Message')
                .setDescription('Disabled leaver Messages on this server!')
                .setColor('#FFFFFF')
                .setTimestamp()
            message.channel.send(embed)
        }
    }
}