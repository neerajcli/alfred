module.exports = {
name: "appeal",
description: "Appeal against a punishment.",
category: "Other",
execute: async (client, message, args) => {
    if (message.author.bot) return;
    
    const Discord = require('discord.js')
const { MessageEmbed } = require('discord.js');
    const db=require('quick.db');
const ms = require("parse-ms")
        const userBlacklistQuestions = [
            "What is your Email ID? (This might be needed if we require further information. Specify N/A if you dont want to disclose.)",
            "What is your type of blacklist? (Temporary/Permanent)",
            "What is your blacklist expiring date? (Specify N/A for permanent blacklist)",
            "Why were you blacklisted?",
            "Why do you believe that you should be removed from the blacklist?",
            "Do you agree to follow our rules this time? (Yes/No)"
        ];

        const serverBlacklistQuestions = [
            "What is your Email ID? (This might be needed if we require further information. Specify N/A if you dont want to disclose.)",
            "What is the type of blacklist for the server? (Temporary/Permanent)",
            "What is the server's blacklist expiring date? (Specify N/A for permanent blacklist)",
            "Why was the server blacklisted?",
            "Why do you believe the server should be removed from the blacklist?",
            "Does your server agree to follow our rules this time? (Yes/No)"
        ];

        const targetChannelID = '1327903156956561439';
        const targetChannel = client.channels.cache.get(targetChannelID);

        if (!targetChannel) return;
    
        message.channel.send('Please choose the type of appeal:\n1️⃣ User Blacklist Appeal\n2️⃣ Server Blacklist Appeal')
            .then(async (msg) => {
                await msg.react('1️⃣');
                await msg.react('2️⃣');

                const filter = (reaction, user) => {
                    return ['1️⃣', '2️⃣'].includes(reaction.emoji.name) && user.id === message.author.id;
                };

                try {
                    const collected = await msg.awaitReactions(filter, { max: 1, time: 15000, errors: ['time'] });
                    const reaction = collected.first();

                    if (reaction.emoji.name === '1️⃣') {
                        const isBlacklisted = await db.fetch("bl_" + message.author.id);
            			if(isBlacklisted != true) return message.channel.send("You are not blacklisted!");
                        let times = await db.fetch('appealed_'+message.author.id);
                        if(times==true) return message.channel.send("An appeal by you is already pending!")
                        let times1 = await db.fetch('tappealed_'+message.author.id);
                        if(times1>=3) return message.channel.send("You have already appealed 3 times, you can no longer appeal");
                         let timeout = 3888000000;
                          let weekly = await db.fetch(`utime_${message.author.id}`);
                        if (weekly !== null && timeout - (Date.now() - weekly) > 0) {
                            let time = ms(timeout - (Date.now() - weekly));
                          let timeEmbed = new Discord.MessageEmbed()
                            .setColor("#FFFFFF") 
                            .setTitle("Cooldown")
                            .setDescription(`You need to wait ${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s to use this command again.`);
                            return message.channel.send(timeEmbed)
                          }
                        db.set("appealtype_"+message.author.id,"u");
                        handleAppeal(userBlacklistQuestions, 'User Blacklist Appeal');
                    } else if (reaction.emoji.name === '2️⃣') {
                        const isSBlacklisted = await db.fetch("blguild_" + message.guild.id);
            			if(isSBlacklisted != true) return message.channel.send("This server is not blacklisted!");
                        if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send('Only admins can appeal against server blacklist.')
                        let times2 = await db.fetch('sappealed_'+message.guild.id);
                        if(times2==true) return message.channel.send("An appeal for this server is already pending!")
                        let times3 = await db.fetch('stappealed_'+message.guild.id);
                        if(times3>=3) return message.channel.send("This server has already appealed 3 times, you can no longer appeal");
                        let timeout = 3888000000;
                          let weekly = await db.fetch(`stime_${message.guild.id}`);
                        if (weekly !== null && timeout - (Date.now() - weekly) > 0) {
                            let time = ms(timeout - (Date.now() - weekly));
                          let timeEmbed = new Discord.MessageEmbed()
                            .setColor("#FFFFFF") 
                            .setTitle("Cooldown")
                            .setDescription(`You need to wait ${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s to use this command again.`);
                           return message.channel.send(timeEmbed)
                          }
                        db.set("appealtype_" + message.guild.id, "s");
                        handleAppeal(serverBlacklistQuestions, 'Server Blacklist Appeal');
                    }
                } catch (err) {
                    message.channel.send('You did not select an option in time. Process stopped.');
                    console.log(err);
                }
            });

        const handleAppeal = async (questions, appealType) => {
            message.channel.send("Answer all the questions to the best of your knowledge. Please note that if your appeal is rejected you will be subjected to a **45 day cooldown** before you can appeal again. You can appeal for a maximum of **3 times** only.")
            let collectedAnswers = [];
            let currentIndex = 0;

            const askQuestion = async () => {
                if (currentIndex < questions.length) {
                    await message.channel.send(questions[currentIndex]);
                    const filter = (response) => response.author.id === message.author.id;

                    try {
                        const collected = await message.channel.awaitMessages(filter, { max: 1, time: 75000, errors: ['time'] });
                        const answer = collected.first().content;
                        collectedAnswers.push(answer);
                        currentIndex++;
                        askQuestion();
                    } catch (err) {
                        message.channel.send('You did not respond in time. Process stopped.');
                    }
                } else {
                    const embed = new MessageEmbed()
                        .setColor('#ffffff')
                        .setTitle(`${appealType}`)
                        .setDescription('Please use `a!accept-appeal <user/serverid>` to accept the appeal or `a!reject-appeal <user/serverid> reason` to reject the appeal.')
                        .setTimestamp()
                        .setFooter('Appeal Collected by Alfred');
                    if(appealType=='User Blacklist Appeal') {
                    	embed.addField('Username',message.author.username);
                    	embed.addField('User ID',message.author.id);
                        db.set('appealed_'+message.author.id,true);
                        db.add('tappealed_'+message.author.id,1)
                    } else {
                    	embed.addField('Guild Name',message.guild.name);
                    	embed.addField('Guild ID',message.guild.id);
                        embed.addField('Submitted By',message.author.username + message.author.id);
                        db.set('sappealed_'+message.guild.id,true);
                        db.add('stappealed_'+message.guild.id,1)
                        db.set('dmres_' + message.guild.id, message.author.id);
                    }
                

                    // Add each question and its corresponding answer as a field
                    questions.forEach((question, index) => {
                        embed.addField(`Q${index + 1}: ${question}`, collectedAnswers[index] || 'No answer provided');
                    });
                    targetChannel.send('<@504635146553524234>', embed);

                    message.channel.send("Appeal submitted, you will recieve the result in your DM's within 7 days (if your dms are open).");
                }
            };

            askQuestion();
        };

}
}
