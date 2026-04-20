module.exports = {
  name: "server-whitelist",
  aliases: ["swl"],
  description: "Whitelists a server from using the bot.",
  usage: "<serverid>",
  execute: async (client, message, args) => {
    const db = client.db;
    let owners = [
      "504635146553524234",
    ];
    if (!owners.includes(message.author.id)) {
      return message.channel.send(`Only the bot-devs can run this command!`);
    }
    let guild = client.guilds.cache.get(args[0])
    if (!guild) return message.channel.send('Provide a guild id to whitelist')
    await db.delete("blguild_" + guild.id)
    await db.delete('blguildtime_' + guild.id)
    await db.delete('blguildreason_' + guild.id)

    message.channel.send(`Successfully whitelisted ${guild.name}`)

  }

}
