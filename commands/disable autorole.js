module.exports = {
    name: 'disable-autorole',
    category: 'Server Premium',
    description: 'Disable autorole in the server.',
    execute: async (client, message, args) => {
        const db = client.db;

        if (message.author.bot) return;
        let isPremium = await db.get('serverpremium_' + message.guild.id)
        if (isPremium !== true) return message.channel.send('This command can only be used in premium servers.')
        let perm = message.member.hasPermission("MANAGE_ROLES");
        if (!perm) return message.channel.send("You don't have the perms to use this. Manage roles perms is needed.");
        await db.delete('autorolestatus_' + message.guild.id)
        await db.delete('roleautorole_' + message.guild.id)
        message.channel.send('Disabled autorole in the server.')
    }
}