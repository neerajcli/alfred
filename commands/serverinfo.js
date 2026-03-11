module.exports = {
    name: "serverinfo",
    description: "Get info about the server",
    category: "Utility",
    execute: async (client, message, args) => {
        if(message.author.bot) return;
        const Discord = require('discord.js')
        let embed = new Discord.MessageEmbed()
            .setColor("#FFFFFF")
            .setTitle("Server Info")
            .setImage(message.guild.iconURL)
            .setDescription(`${message.guild}'s information`)
            .addField("Owner", `${message.guild.owner}`)
            .addField("Member Count", `${message.guild.memberCount}`)
            .addField("Emoji Count", `${message.guild.emojis.cache.size}`)
            .addField("Roles Count", `${message.guild.roles.cache.size}`)
            .addField("Creation Date",  message.guild.createdAt.toLocaleString())

        message.channel.send(embed)
    }
}