module.exports = {
    name: 'support',
    description: "Get invite to bot's suppoer server.",
    category: 'Other',
    execute: async (client, message, args) => {
        const Discord = require('discord.js');
        if(message.author.bot) return;
        const supportQuestion = [
            "What is your Email ID? (This might be needed if we need to reach you. Specify N/A if you dont want to disclose. Not sharing might result in lack of resolution.)",
            "Are you facing the issue in a specific server? (Yes/No). If yes, please provide the server ID.",
            "Describe your issue in detail."
        ]
        const targetChannelID = '1478004017513762838';
        const targetChannel = client.channels.cache.get(targetChannelID);
        if(!targetChannel) return message.channel.send('A critical error occured. Please contact developers.');

        const handleSupport = async (questions) => {
            message.channel.send("Please answer the following questions for us to help you better.");
            let collectedAnswers = [];
            let currentIndex = 0;
            const askQuestion = async() => {
                if(currentIndex<questions.length) {
                    await message.channel.send(questions[currentIndex]);
                    const filter = (response) => response.author.id === message.author.id;
                    try {
                        const collected = await message.channel.awaitMessages(filter, { max: 1, time: 90000, errors: ['time']});
                        const answer = collected.first().content;
                        collectedAnswers.push(answer);
                        currentIndex++;
                        askQuestion();
                    } catch (err) {
                        message.channel.send('You did not respond in time. Try copy/pasting if you think time is less.');
                    }
                 } else {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('Assistance Required')
                    .setTimestamp()
                    .setColor('#FFFFFF')
                    .setFooter("Responses Collected by Alfred")
                    .addField("Username", message.author.username)
                    .addField("User ID", message.author.id)
                    .addField("Sent From", message.guild.id)
                    questions.forEach((question,index)=> {
                        embed.addField(`Q${index+1}: ${question}`, collectedAnswers[index] || "No answer provided");
                    })
                    targetChannel.send('<@504635146553524234>', embed);
                    message.channel.send("We have received your query and will resolve it ASAP!");
                 }
            }
            askQuestion();
        }
        handleSupport(supportQuestion);
    }
}
