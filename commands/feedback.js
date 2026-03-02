module.exports = {
name: "feedback",
description: "Give feedback for our bot.",
category: "Other",
execute: async (client, message, args) => {
    if (message.author.bot) return;
    const targetChannelID = '1478012706731851847';
    const targetChannel = client.channels.cache.get(targetChannelID);
    if (!targetChannel) return message.channel.send('A critical error occured. Please contact developers.'); 
    let feedback = args.slice(0).join(" ");
    if(!feedback) return message.channel.send("Please specify feedback message!");
    const Discord = require('discord.js');
    const embed = new Discord.MessageEmbed()
    .setColor('#FFFFFF')
    .setTitle('Feedback')
    .setDescription(feedback)
    .setTimestamp()
    .setFooter(`Sent by ${message.author.username} (${message.author.id})`)
    targetChannel.send(embed)
    message.channel.send("Your feedback has been submitted!")
}
}
