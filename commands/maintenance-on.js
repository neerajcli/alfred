module.exports = {
  name: "maintenance-on",
  description: "Starts bot's maintenance",
  execute: async (client, message, args) => {
    const db = client.db;
    const Discord = client.discord;

    let owners = [
      "504635146553524234",
    ];
    if (!owners.includes(message.author.id)) {
      return message.channel.send(`Only the bot-devs can run this command!`);
    }
    let time = args.slice(0).join(" ");
    if (!time) time = "No ETA"
    await db.set("maintenance_", true)
    await db.set("maintenancetime_", `${time}`)
    const embed = new Discord.MessageEmbed()
      .setTitle('Maintenance Started')
      .setDescription("Started bot's maintenance.")
      .addField("End time :-", `${time}`)
      .setColor('#FFFFFF')
    message.channel.send(embed)

  }

}