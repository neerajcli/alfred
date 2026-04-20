const discord = require("discord.js");

const client = new discord.Client({
  disableEveryone: true,
  disabledEvents: ["TYPING_START", "PRESENCE_UPDATE"],
});

client.discord = discord;
const { QuickDB } = require("quick.db");
const db = new QuickDB();
client.db = db;
const { readdirSync } = require("fs");
const { join } = require("path");
const { TOKEN, PREFIX } = require("./config.json");

client.on("ready", async () => {
  client.user.setActivity(
    `https://alfredbot.statuspage.io/. Ping for prefix!`,
    {
      type: "WATCHING",
    },
  );
  console.log("Bot is Ready");
});

client.on("warn", (info) => console.log(info));

client.on("error", console.error);

client.commands = new discord.Collection();
client.prefix = PREFIX;
client.capitalize = (string) => {
  let str = "";
  string = string.split(" ");
  for (let i = 0; i < string.length; i++) {
    str +=
      string[i].charAt(0).toUpperCase() +
      string[i].slice(1).toLowerCase() +
      " ";
    if (i == string.length - 1) {
      string = str.split("-");
      str = "";
      for (let i = 0; i < string.length; i++) {
        str += string[i].charAt(0).toUpperCase() + string[i].slice(1) + "-";
        if (i == string.length - 1) {
          return str.slice(0, -2);
        }
      }
    }
  }
};

const cmdFiles = readdirSync(join(__dirname, "commands")).filter((file) =>
  file.endsWith(".js"),
);
for (const file of cmdFiles) {
  const command = require(join(__dirname, "commands", file));
  client.commands.set(command.name, command);
}

client.on("message", async (message) => {
  if (message.author.bot) return;
  if (message.channel.type == "dm") return;
  if (!message.guild) return;

  if (message.mentions.users.size > 0) {
    let person = message.mentions.users.first();
    let afkStatus = await db.get(`afk_${person.id}`);
    if (afkStatus == true) {
      let afkReason = await db.get(`afkreason_${person.id}`);
      if (afkReason === null) afkReason = "No Reason Provided";
      let afkEmbed = new discord.MessageEmbed()
        .setTitle("AFK")
        .setDescription(`${person.username} is AFK for ${afkReason}!`)
        .setColor("#FFFFFF")
        .setTimestamp();
      message.channel.send(afkEmbed);
    }
  }

  function reverseString(s) {
    return s.split("-").reverse().join("");
  }

  let date1 = new Date();
  let day1 = date1.getDate();
  let month1 = date1.getMonth() + 1;
  let year1 = date1.getFullYear();
  let finalDate = `${year1}${month1}${day1}`;

  let isBl = await db.get("bl_" + message.author.id);
  let blTime1 = null;
  if (isBl === true) {
    blTime1 = await db.get("bltime_" + message.author.id);
    let blTime = null;
    if (blTime1 === null || blTime1.toLowerCase() === "never") {
      blTime = blTime1;
    } else {
      blTime = reverseString(blTime1);
    }
    if (finalDate >= blTime) {
      await db.delete("bl_" + message.author.id);
    }
  }

  let isBlGuild = await db.get("blguild_" + message.guild.id);
  let blGuildTime1 = null;
  if (isBlGuild === true) {
    blGuildTime1 = await db.get("blguildtime_" + message.guild.id);
    let blGuildTime = null;
    if (blGuildTime1 === null || blGuildTime1.toLowerCase() === "never") {
      blGuildTime = blGuildTime1;
    } else {
      blGuildTime = reverseString(blGuildTime1);
    }
    if (finalDate >= blGuildTime) {
      await db.delete("blguild_" + message.guild.id);
    }
  }

  let isUserPremium = await db.get("userpremium_" + message.author.id);
  if (isUserPremium === true) {
    let userPremiumTime1 = await db.get("userpremiumtime_" + message.author.id);
    let userPremiumTime = null;
    if (
      userPremiumTime1 === null ||
      userPremiumTime1.toLowerCase() === "permanent"
    ) {
      userPremiumTime = userPremiumTime1;
    } else {
      userPremiumTime = reverseString(userPremiumTime1);
    }
    if (finalDate >= userPremiumTime) {
      await db.delete("userpremium_" + message.author.id);
    }
  }

  let isServerPremium = await db.get("serverpremium_" + message.guild.id);
  if (isServerPremium === true) {
    let serverPremiumTime1 = await db.get(
      "serverpremiumtime_" + message.guild.id,
    );
    let serverPremiumTime = null;
    if (
      serverPremiumTime1 === null ||
      serverPremiumTime1.toLowerCase() === "permanent"
    ) {
      serverPremiumTime = serverPremiumTime1;
    } else {
      serverPremiumTime = reverseString(serverPremiumTime1);
    }
    if (finalDate >= serverPremiumTime) {
      await db.delete("serverpremium_" + message.guild.id);
    }
  }

  let wmenabled = await db.get("ewordm" + message.guild.id);
  if (wmenabled === 1) {
    let word1 = await db.get("word1" + message.guild.id);
    if (word1 === null) {
      word1 = "not set";
    }
    let word2 = await db.get("word2" + message.guild.id);
    if (word2 === null) {
      word2 = "not set";
    }
    let word3 = await db.get("word3" + message.guild.id);
    if (word3 === null) {
      word3 = "not set";
    }
    let word4 = await db.get("word4" + message.guild.id);
    if (word4 === null) {
      word4 = "not set";
    }
    let word5 = await db.get("word5" + message.guild.id);
    if (word5 === null) {
      word5 = "not set";
    }
    let word6 = await db.get("word6" + message.guild.id);
    if (word6 === null) {
      word6 = "not set";
    }
    let word7 = await db.get("word7" + message.guild.id);
    if (word7 === null) {
      word7 = "not set";
    }
    let word8 = await db.get("word8" + message.guild.id);
    if (word8 === null) {
      word8 = "not set";
    }
    let word9 = await db.get("word9" + message.guild.id);
    if (word9 === null) {
      word9 = "not set";
    }
    let word10 = await db.get("word10" + message.guild.id);
    if (word10 === null) {
      word10 = "not set";
    }
    word1 = word1.toLowerCase();
    word2 = word2.toLowerCase();
    word3 = word3.toLowerCase();
    word4 = word4.toLowerCase();
    word5 = word5.toLowerCase();
    word6 = word6.toLowerCase();
    word7 = word7.toLowerCase();
    word8 = word8.toLowerCase();
    word9 = word9.toLowerCase();
    word10 = word10.toLowerCase();
    const words = [
      word1,
      word2,
      word3,
      word4,
      word5,
      word6,
      word7,
      word8,
      word9,
      word10,
    ];
    let message1 = message.content;
    message1 = message1.toLowerCase();
    words.forEach((word) => {
      if (
        message.content.toLowerCase().includes(word) &&
        message1 !== "not set"
      ) {
        message.delete();
        message.channel.send(
          "<@" +
          message.author.id +
          ">, Your message has been deleted for containing a restricted word. Please dont use it again",
        );
      }
    });
  }

  if (message.content.startsWith("eval")) {
    let owners = ["504635146553524234"];
    if (!owners.includes(message.author.id)) return;
    const args = message.content.split(" ").slice(1);
    const clean = (text) => {
      if (typeof text === "string")
        return text
          .replace(/`/g, "`" + String.fromCharCode(8203))
          .replace(/@/g, "@" + String.fromCharCode(8203));
      else return text;
    };
    try {
      const code = args.join(" ");
      let evaled = eval(code);

      if (typeof evaled !== "string") evaled = require("util").inspect(evaled);

      message.channel.send(clean(evaled), { code: "xl" });
    } catch (err) {
      message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
    }
  } else {
    let prefix1 = await db.get(`prefix_${message.guild.id}`);
    if (prefix1 === null) prefix1 = PREFIX;
    if (
      message.content === "<@670234327749099521>" ||
      message.content === "<@!670234327749099521>"
    ) {
      return message.channel.send(
        "My prefix for the server is `" + prefix1 + "`.",
      );
    } else if (message.content.startsWith(prefix1)) {
      const args = message.content.slice(prefix1.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      if (!client.commands.has(command)) {
        return;
      }
      let owners = ["504635146553524234"];
      if (!owners.includes(message.author.id)) {
        if (isBl === true && client.commands.get(command).name != "appeal") {
          let blReason = await db.get("blreason_" + message.author.id);
          const blEmbed = new discord.MessageEmbed()
            .setTitle("You are currently blacklisted!")
            .setDescription(
              "**`Blacklist expires:`** ||" +
              `${blTime1}` +
              "||" +
              `\n` +
              "**`Blacklist reason:`** " +
              `${blReason}` +
              `\n\n` +
              "*If you think this is a mistake please use `a!appeal` to appeal against the blacklist.*",
            )
            .setColor("#FFFFFF")
            .setFooter(
              "For temporary blacklist, you need to send a message on or after the blacklist expiring date to get whitelisted",
            );
          return message.channel.send(blEmbed);
        }
        if (
          isBlGuild === true &&
          client.commands.get(command).name != "appeal"
        ) {
          let blGuildReason = await db.get("blguildreason_" + message.guild.id);
          const blGuildEmbed = new discord.MessageEmbed()
            .setTitle("This server is currently blacklisted!")
            .setDescription(
              "**`Blacklist expires:`** ||" +
              `${blGuildTime1}` +
              "||" +
              `\n` +
              "**`Blacklist reason:`** " +
              `${blGuildReason}` +
              `\n\n` +
              "*If you think this is a mistake please use `a!appeal` to appeal against the blacklist. Appealing by multiple users won't increase the chances of being whitelisted.*",
            )
            .setColor("#FFFFFF")
            .setFooter(
              "For temporary server blacklist, someone needs to send a message in the server on or after the blacklist expiring date for the server to get whitelisted",
            );
          return message.channel.send(blGuildEmbed);
        }
        let maintenance = await db.get("maintenance_");
        if (maintenance === true) {
          let maintenanceTime = await db.get("maintenancetime_");
          const maintenanceEmbed = new discord.MessageEmbed()
            .setTitle("Under Maintenance")
            .setDescription(
              "We are sorry but we are on maintenance so you cant use commands right now. Kindly try after some time.",
            )
            .addField("End Time :-", maintenanceTime)
            .setColor("#FFFFFF");
          return message.channel.send(maintenanceEmbed);
        }
      }

      try {
        client.commands.get(command).execute(client, message, args);
        console.log(
          `${message.guild.name}: ${message.author.tag} Used ${client.commands.get(command).name
          } in #${message.channel.name} ${message.content}`,
        );
        const o = client.channels.cache.get("748878657723957319");
        const embed = new discord.MessageEmbed()
          .setTitle("Bot command used")
          .setDescription(
            `${message.guild.name} : ${message.author.tag} used ${client.commands.get(command).name} in ${message.channel.name}`,
          )
          .addField("Content :", message.content)
          .setColor("#FFFFFF")
          .setThumbnail(message.author.avatarURL())
          .setTimestamp();
        o.send(embed);
      } catch (err) {
        console.log(err);
        console.log(message.content);
        const o = client.channels.cache.get("748878657723957319");
        const embed = new discord.MessageEmbed()
          .setTitle("An error occured while using a command")
          .setDescription(err)
          .addField("Content :", message.content)
          .setColor("FFFFFF")
          .setTimestamp();
        o.send(embed);
        message.reply(
          "I'm getting error on using this command! Please contact developers!",
        );
      }
    } else if (message.content.startsWith("<@670234327749099521>")) {
      const args = message.content
        .slice("<@670234327749099521>".length)
        .trim()
        .split(/ +/);
      const command = args.shift().toLowerCase();

      if (!client.commands.has(command)) {
        return;
      }

      let owners = ["504635146553524234"];
      if (!owners.includes(message.author.id)) {
        if (isBl === true && client.commands.get(command).name != "appeal") {
          let blReason = await db.get("blreason_" + message.author.id);
          const blEmbed = new discord.MessageEmbed()
            .setTitle("You are currently blacklisted!")
            .setDescription(
              "**`Blacklist expires:`** ||" +
              `${blTime1}` +
              "||" +
              `\n` +
              "**`Blacklist reason:`** " +
              `${blReason}` +
              `\n\n` +
              "*If you think this is a mistake please use `a!appeal` to appeal against the blacklist.*",
            )
            .setColor("#FFFFFF")
            .setFooter(
              "For temporary blacklist, you need to send a message on or after the blacklist expiring date to get whitelisted",
            );
          return message.channel.send(blEmbed);
        }
        if (
          isBlGuild === true &&
          client.commands.get(command).name != "appeal"
        ) {
          let blGuildReason = await db.get("blguildreason_" + message.guild.id);
          const blGuildEmbed = new discord.MessageEmbed()
            .setTitle("This server is currently blacklisted!")
            .setDescription(
              "**`Blacklist expires:`** ||" +
              `${blGuildTime1}` +
              "||" +
              `\n` +
              "**`Blacklist reason:`** " +
              `${blGuildReason}` +
              `\n\n` +
              "*If you think this is a mistake please use `a!appeal` to appeal against the blacklist. Appealing by multiple users won't increase the chances of being whitelisted.*",
            )
            .setColor("#FFFFFF")
            .setFooter(
              "For temporary server blacklist, someone needs to send a message in the server on or after the blacklist expiring date for the server to get whitelisted",
            );
          return message.channel.send(blGuildEmbed);
        }
        let maintenance = await db.get("maintenance_");
        if (maintenance === true) {
          let maintenanceTime = await db.get("maintenancetime_");
          const maintenanceEmbed = new discord.MessageEmbed()
            .setTitle("Under Maintenance")
            .setDescription(
              "We are sorry but we are on maintenance so you cant use commands right now. Kindly try after some time.",
            )
            .addField("End Time :-", maintenanceTime)
            .setColor("#FFFFFF");
          return message.channel.send(maintenanceEmbed);
        }
      }

      try {
        client.commands.get(command).execute(client, message, args);
        console.log(
          `${message.guild.name}: ${message.author.tag} Used ${client.commands.get(command).name
          } in #${message.channel.name} ${message.content}`,
        );
        const o = client.channels.cache.get("748878657723957319");
        const embed = new discord.MessageEmbed()
          .setTitle("Bot command used")
          .setDescription(
            `${message.guild.name} : ${message.author.tag} used ${client.commands.get(command).name} in ${message.channel.name}`,
          )
          .addField("Content :", message.content)
          .setColor("#FFFFFF")
          .setThumbnail(message.author.avatarURL())
          .setTimestamp();
        o.send(embed);
      } catch (err) {
        console.log(err);
        console.log(message.content);
        const o = client.channels.cache.get("748878657723957319");
        const embed = new discord.MessageEmbed()
          .setTitle("An error occured while using a command")
          .setDescription(err)
          .setColor("FFFFFF")
          .setTimestamp()
          .addField("Content :", message.content);
        o.send(embed);
        message.reply(
          "I'm getting error on using this command! Please contact developers!",
        );
      }
    } else if (message.content.startsWith("<@!670234327749099521>")) {
      const args = message.content
        .slice("<@!670234327749099521>".length)
        .trim()
        .split(/ +/);
      const command = args.shift().toLowerCase();

      if (!client.commands.has(command)) {
        return;
      }
      let owners = ["504635146553524234"];
      if (!owners.includes(message.author.id)) {
        if (isBl === true && client.commands.get(command).name != "appeal") {
          let blReason = await db.get("blreason_" + message.author.id);
          const blEmbed = new discord.MessageEmbed()
            .setTitle("You are currently blacklisted!")
            .setDescription(
              "**`Blacklist expires:`** ||" +
              `${blTime1}` +
              "||" +
              `\n` +
              "**`Blacklist reason:`** " +
              `${blReason}` +
              `\n\n` +
              "*If you think this is a mistake please use `a!appeal` to appeal against the blacklist.*",
            )
            .setColor("#FFFFFF")
            .setFooter(
              "For temporary blacklist, you need to send a message on or after the blacklist expiring date to get whitelisted",
            );
          return message.channel.send(blEmbed);
        }
        if (
          isBlGuild === true &&
          client.commands.get(command).name != "appeal"
        ) {
          let blGuildReason = await db.get("blguildreason_" + message.guild.id);
          const blGuildEmbed = new discord.MessageEmbed()
            .setTitle("This server is currently blacklisted!")
            .setDescription(
              "**`Blacklist expires:`** ||" +
              `${blGuildTime1}` +
              "||" +
              `\n` +
              "**`Blacklist reason:`** " +
              `${blGuildReason}` +
              `\n\n` +
              "*If you think this is a mistake please use `a!appeal` to appeal against the blacklist. Appealing by multiple users won't increase the chances of being whitelisted.*",
            )
            .setColor("#FFFFFF")
            .setFooter(
              "For temporary server blacklist, someone needs to send a message in the server on or after the blacklist expiring date for the server to get whitelisted",
            );
          return message.channel.send(blGuildEmbed);
        }
        let maintenance = await db.get("maintenance_");
        if (maintenance === true) {
          let maintenanceTime = await db.get("maintenancetime_");
          const maintenanceEmbed = new discord.MessageEmbed()
            .setTitle("Under Maintenance")
            .setDescription(
              "We are sorry but we are on maintenance so you cant use commands right now. Kindly try after some time.",
            )
            .addField("End Time :-", maintenanceTime)
            .setColor("#FFFFFF");
          return message.channel.send(maintenanceEmbed);
        }
      }

      try {
        client.commands.get(command).execute(client, message, args);
        console.log(
          `${message.guild.name}: ${message.author.tag} Used ${client.commands.get(command).name
          } in #${message.channel.name} ${message.content}`,
        );
        const o = client.channels.cache.get("748878657723957319");
        const embed = new discord.MessageEmbed()
          .setTitle("Bot command used")
          .setDescription(
            `${message.guild.name} : ${message.author.tag} used ${client.commands.get(command).name} in ${message.channel.name}`,
          )
          .setColor("#FFFFFF")
          .addField("Content :", message.content)
          .setThumbnail(message.author.avatarURL())
          .setTimestamp();
        o.send(embed);
      } catch (err) {
        console.log(err);
        console.log(message.content);
        const o = client.channels.cache.get("748878657723957319");
        const embed = new discord.MessageEmbed()
          .setTitle("An error occured while using a command")
          .setDescription(err)
          .setColor("FFFFFF")
          .setTimestamp()
          .addField("Content :", message.content);
        o.send(embed);
        message.reply(
          "I'm getting error on using this command! Please contact developers!",
        );
      }
    }
  }
});

client.on("guildMemberAdd", async (member) => {
  let maintenance = await db.get("maintenance_");
  if (maintenance === true) return;
  let bls = await db.get(`blguild_${member.guild.id}`);
  if (bls === true) return;
  let isAutoroleEnable = await db.get("autorolestatus_" + member.guild.id);
  if (isAutoroleEnable === true) {
    let autoroleRole = await db.get("roleautorole_" + member.guild.id);
    if (autoroleRole !== null) {
      let isAuthorized = await db.get("serverpremium_" + member.guild.id);
      if (isAuthorized === true) {
        member.roles.add(autoroleRole);
      }
    }
  }

  const we = await db.get(`we_${member.guild.id}`);
  if (we === true) {
    const ws = await db.get(`ws_${member.guild.id}`);
    if (ws !== true) return;
    const channel1 = await db.get(`wc_${member.guild.id}`);
    if (!channel1) return;
    const channel = member.guild.channels.cache.get(channel1);
    const embed = new discord.MessageEmbed()
      .setTitle("Member joined!")
      .setDescription(
        "Welcome <@" +
        member.user.id +
        "> to the server! Hope you enjoy the stay in the server. Do agree to follow our rules.",
      )
      .setColor("#FFFFFF")
      .setTimestamp()
      .setThumbnail(member.user.avatarURL());
    channel.send(embed);
  } else {
    return;
  }
});

client.on("guildMemberRemove", async (member) => {
  let maintenance = await db.get("maintenance_");
  if (maintenance === true) return;
  let bls = await db.get(`blguild_${member.guild.id}`);
  if (bls === true) return;
  const we = await db.get(`le_${member.guild.id}`);
  if (we === true) {
    const ws = await db.get(`ls_${member.guild.id}`);
    if (ws !== true) return;
    const channel1 = await db.get(`lc_${member.guild.id}`);
    if (!channel1) return;
    const channel = member.guild.channels.cache.get(channel1);
    const embed = new discord.MessageEmbed()
      .setTitle("Member Left!")
      .setDescription(
        member.user.username +
        " just left the server! We hope to see you again someday.",
      )
      .setColor("#FFFFFF")
      .setTimestamp()
      .setThumbnail(member.user.avatarURL());
    channel.send(embed);
    await db.delete("captcha_" + message.guild.id + message.author.id);
    await db.set("verified_" + message.guild.id + message.author.id, false);
  }
});

client.login(TOKEN);
