const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "privacy-policy",
    category: "Other",
    description: "Privacy policy of our bot",
    execute: async (client, message, args) => {
      const embed = new Discord.MessageEmbed()
      .setTitle('Privacy Policy')
      .setDescription(`**What sesnitive data we access**\n\n- The guilds/servers you join.\n- The content of the messages you send.\n\n\n**Why we access this data**\n\nSome features of our bot like welcomer/leaver and word moderation requires us to access information about which guilds you join/leave and what messages you send.\n\n\n**Data Processing and Safety**\n\nWe do not store your sensitive data in any way, none of our developers have access to this sensitive data. The data is accessed at the time you trigger our bot and is immediately deleted after the command is executed.`)
      .setColor('#FFFFFF')
      .setFooter('By using our bot you agree to accept our privacy policy.')
      message.channel.send(embed)
    }
}
