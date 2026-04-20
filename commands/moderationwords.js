module.exports = {
    name: "moderationwords",
    category: "Moderation",
    description: "Shows moderation words.",
    execute: async (client, message, args) => {
        const db = client.db;
        const Discord = client.discord;
        if (!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('You cant do this.')
        let wordEnabled = await db.get('ewordm' + message.guild.id)
        if (wordEnabled !== 1) return message.channel.send('Word moderation not enabled.')
        let word1 = await db.get('word1' + message.guild.id)
        let word2 = await db.get('word2' + message.guild.id)
        let word3 = await db.get('word3' + message.guild.id)
        let word4 = await db.get('word4' + message.guild.id)
        let word5 = await db.get('word5' + message.guild.id)
        let word6 = await db.get('word6' + message.guild.id)
        let word7 = await db.get('word7' + message.guild.id)
        let word8 = await db.get('word8' + message.guild.id)
        let word9 = await db.get('word9' + message.guild.id)
        let word10 = await db.get('word10' + message.guild.id)
        const embed = new Discord.MessageEmbed()
            .setTitle('Moderated Words')
            .addField('1', word1, true)
            .addField('2', word2, true)
            .addField('3', word3, true)
            .addField('4', word4, true)
            .addField('5', word5, true)
            .addField('6', word6, true)
            .addField('7', word7, true)
            .addField('8', word8, true)
            .addField('9', word9, true)
            .addField('10', word10, true)
            .setColor('#FFFFFF')
        message.channel.send(embed)
    }
}
