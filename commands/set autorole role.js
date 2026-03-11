const { QuickDB } = require("quick.db")
const db = new QuickDB();
module.exports = {
    name: 'role-set-autorole',
    description: 'Set role for autorole in the server.',
    execute: async (client, message, args) => {

        if(message.author.bot) return;
      let isPremium = await db.get('serverpremium_' + message.guild.id)
if(isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
        let perm = message.member.hasPermission("MANAGE_ROLES");
    if (!perm) return message.channel.send("You don't have the perms to use this. Manage roles perms is needed.");
       let isEnabled = await db.get('autorolestatus_' + message.guild.id)
       if(isEnabled !== true) return message.channel.send('Autorole is disabled in the server. Please enable it first.')
        let role = message.mentions.roles.first()
        if(!role) return message.channel.send('Please mention a role.')
        await db.set('roleautorole_' + message.guild.id, role.id)
        message.channel.send(`Role for autorole is set to ${role.name}.`)
        }
    }