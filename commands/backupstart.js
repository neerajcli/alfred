module.exports = {
  name: "backup-start",
  description: "Run the bot on last created backup!",
  execute: async (client, message, args) => { const ms = require('ms')
let owners = [
"504635146553524234"
]
if(!owners.includes(message.author.id)) return message.channel.send('Only Bot-Devs can do it!');
let msg = await message.channel.send('Initiating Backup Starting Procedure! This may take a while!')
let time1 = "29s";
    setTimeout(function() {
      msg.edit(`~~Initiating Backup Starting Procedure! This may take a while!~~\n\nSearching for last created Backup!`);
    }, ms(time1));
let time2 = "48s";
    setTimeout(function() {
      msg.edit(`~~Initiating Backup Starting Procedure! This may take a while!~~\n\n~~Searching for last created Backup!~~\n\nBackup found, starting myself on backup! This may take a few seconds!`);
    }, ms(time2));
let time3 = "65s";
    setTimeout(function() {
      msg.edit(`~~Initiating Backup Starting Procedure! This may take a while!~~\n\n~~Searching for last created Backup!~~\n\n~~Backup found, starting myself on backup! This may take a few seconds!~~\n\nBackup initiation completed. I am now working on backup, restart if you want me to work on main code again.`);
    }, ms(time3));
}
}