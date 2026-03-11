const discord = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "hack",
  category: "Fun",
  aliases: ["hacksomeone"],
  description: "The totally real hack to hack users",
  usage: "<to hack>",
  execute: async (client, message, args) => {
    const embed1 = new discord.MessageEmbed()
      .setColor("RED")
      .setDescription("Specify who do you want to hack");
    const user = message.mentions.members.first();
    if (!user) return message.channel.send(embed1);

    let msg = await message.channel.send('Beginning hacking <@' + user.id + ">");

    let time1 = "3s";
    setTimeout(function() {
      msg.edit('Searching for <@' + user.id + ">'s email...");
    }, ms(time1));

    let time2 = "6s";
    setTimeout(function() {
      msg.edit("Email found, email is " + `${message.mentions.users.first().username}` + "@gmail.com");
    }, ms(time2));

    let time3 = "9s";
    setTimeout(function() {
      msg.edit("Searching for <@" + user.id + ">'s password...");
    }, ms(time3));

    let time4 = "12s";
    setTimeout(function() {
      msg.edit('Password found, password is `' + `${message.mentions.users.first().username}` + '`.');
    }, ms(time4));

    let time5 = "15s";
    setTimeout(function() {
      msg.edit('Deleting all information about <@' + user.id + ">");
    }, ms(time5));

    let time6 = "18s";
    setTimeout(function() {
      msg.edit(
    'Finished hacking <@' + user.id + '> with the totally real software hack.');
    }, ms(time6));
  }
};