module.exports = {
    name: "captcha-gen",
    category: "Verify",
    description: 'Generates captcha so that you can verify',
    execute: async(client, message, args) => {
        if (message.author.bot) return;
        const db = require('quick.db')
        const Discord = require('discord.js')
        let we = await db.fetch(`captchae_${message.guild.id}`)
        if(we !== true) return message.channel.send('Captcha system is not enabled')
        const wse = await db.fetch(`captchare_${message.guild.id}`) 
        if(wse !== true) return message.channel.send('Captcha role is not set.')
        const verified = await db.fetch(`verified_${message.guild.id}${message.author.id}`)
        if (verified === true) return message.channel.send('You have already verified once.')
        function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
        const captcha = makeid(6)
        db.set("captcha_" + message.guild.id + message.author.id, captcha)
        const user = message.guild.members.cache.get(message.author.id)
        const embed = new Discord.MessageEmbed()
        .setTitle('Captcha')
        .setDescription('**The code is in the image - These codes are case sensitive. Type `a!captcha-ver <code>` in the server for which u generated captcha. Dont include `<>` in your code.**')
        .setColor('#FFFFFF')
        .setTimestamp()
        .setImage("https://dummyimage.com/700x250/ff3399/000000.jpg&text=" + captcha)
        user.send(embed)
        message.channel.send('Check your DMs!')
    }
}