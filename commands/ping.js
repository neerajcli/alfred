module.exports = {
    name: 'ping',
    description: 'Get bots ping',
    category: 'Utility',
    execute: async (client, message, args) => {
        const m = await message.channel.send("**Checking for the ping**...");
    m.edit(
      `***✎Bot Ping: ${m.createdTimestamp -
        message.createdTimestamp}ms***\n***✎API Ping: ${Math.round(
        client.ws.ping
      )}ms***`
    );
    }
}