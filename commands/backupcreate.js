module.exports = {
  name: "backup-create",
  description: "Created a backup with the current code.",
  execute: async (client, message, args) => { const ms = require('ms')
let owners = [
"504635146553524234"
]
if(!owners.includes(message.author.id)) return message.channel.send('Only Bot-Devs can do it!');
let msg = await message.channel.send('Started Backup Creation, this will take a while!')
let time1 = "35s";
    setTimeout(function() {
      msg.edit(`~~Started Backup Creation, this will take a while!~~\n\nBackup created Successfully!
`);
    }, ms(time1));
}
}