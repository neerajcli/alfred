module.exports = {
    name: 'disable-autorole',
    category: 'Server Premium',
    description: 'Disable autorole in the server.',
    execute: async (client, message, args) => {
        const db = require('quick.db')
        if(message.author.bot) return;
      let isPremium = await db.fetch('serverpremium_' + message.guild.id)
if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
        let perm = message.member.hasPermission("MANAGE_ROLES");
    if (!perm) return message.channel.send("You don't have the perms to use this. Manage roles perms is needed.");
        db.set('autorolestatus_' + message.guild.id, null)
        db.set('roleautorole_' + message.guild.id, null)
        message.channel.send('Disabled autorole in the server.')
        }
    }