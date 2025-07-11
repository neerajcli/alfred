const db = require('quick.db')
const { MessageEmbed } = require("discord.js");
const { readdirSync } = require("fs");
module.exports = {
  name: "help",
  description: "All the command are displayed here.",
  aliases: ["h"],
  category: "Utility",
  execute(client, message, args) {
    let music = [];
    let utility = [];
    let fun = [];
    let moderation = [];
    let economy = [];
    let ticket = [];
    let greet = [];
    let image = [];
    let verify = [];
    let userpremium = [];
    let serverpremium = [];
    let other = [];
    let prefix = "a!";

    if (args[0]) {
      let command = args[0];
      if (client.commands.has(command)) {
        command =
          client.commands.get(command) ||
          client.commands.get(client.aliases.get(command));
        let embed = new MessageEmbed()
          .setAuthor(message.author.username, message.author.avatarURL())
          .setThumbnail(message.guild.iconURL())
          .setTitle("Help!")
          .addField(
            "Command Name",
            `${client.capitalize(command.name) || "No Name"}`,
            true
          )
          .addField(
            "Command Description",
            command.description || "No Description",
            true
          )
          .addField("Command Category", command.category || "No Category", true)
          .setColor("00ffff");
        message.channel.send(embed).catch(console.log);
      }
 } else {
      client.commands
        .filter(cmd => cmd.category === "Music")
        .forEach(cmd => music.push(cmd.name));
      client.commands
        .filter(cmd => cmd.category === "Utility")
        .forEach(cmd => utility.push(cmd.name));
      client.commands
        .filter(cmd => cmd.category === "Fun")
        .forEach(cmd => fun.push(cmd.name));
      client.commands
        .filter(cmd => cmd.category === "Moderation")
        .forEach(cmd => moderation.push(cmd.name));
      client.commands
        .filter(cmd => cmd.category === "Economy")
        .forEach(cmd => economy.push(cmd.name));
      client.commands
        .filter(cmd => cmd.category === "Ticket")
        .forEach(cmd => ticket.push(cmd.name));
      client.commands
        .filter(cmd => cmd.category === "Greet")
        .forEach(cmd => greet.push(cmd.name));
      client.commands
        .filter(cmd => cmd.category === "Image")
        .forEach(cmd => image.push(cmd.name));
      client.commands
        .filter(cmd => cmd.category === "Verify")
        .forEach(cmd => verify.push(cmd.name));
      client.commands
        .filter(cmd => cmd.category === "User Premium")
        .forEach(cmd => userpremium.push(cmd.name));
      client.commands
        .filter(cmd => cmd.category === "Other")
        .forEach(cmd => other.push(cmd.name)); 
     client.commands
        .filter(cmd => cmd.category === "Server Premium")
        .forEach(cmd => serverpremium.push(cmd.name));
        const prefix1 = db.fetch(`prefix_${message.guild.id}`)
      let embed = new MessageEmbed()
        .setAuthor("❝Command Section❞", client.user.displayAvatarURL())
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription(`♪ Command list of ${client.user.username}.`)
        .addField(
          `➜  Utility Commands`,
          "`" + prefix + utility.join("`, " + "`" + prefix) + "`",
          true
        )
        .addField(
          `➜  Fun Commands`,
          "`" + prefix + fun.join("`, " + "`" + prefix) + "`",
          true
        )
        .addField(
          `➜ Moderation Commands`,
          "`" + prefix + moderation.join("`," + "`" + prefix) + "`",
          true
        ) 
        .addField(
          `➜ Greet Commands`,
          "`" + prefix + greet.join("`," + "`" + prefix) + "`",
          true
        ) 
        .addField(
          `➜ Image Commands`,
          "`" + prefix + image.join("`," + "`" + prefix) + "`",
          true
        ) 
        .addField(
          `➜ Verify Commands`,
          "`" + prefix + verify.join("`," + "`" + prefix) + "`",
          true
        )
        .addField(
          `➜ Other Commands`,
          "`" + prefix + other.join("`," + "`" + prefix) + "`",
          true
        )
        .addField(
          `➜ Economy Commands`,
         "`" + prefix + economy.join("`," + "`" + prefix) + "`",
          true
        )
      .addField(
          `➜ User Premium Commands`,
         "`" + prefix + userpremium.join("`," + "`" + prefix) + "`",
          true
        )
      .addField(
          `➜ Server Premium Commands`,
         "`" + prefix + serverpremium.join("`," + "`" + prefix) + "`",
          true
        )
        .setTimestamp()
        .setColor('#FFFFFF');
      message.channel.send(embed).catch(console.log);
 }
  }
};