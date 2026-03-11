const { QuickDB } = require("quick.db")
      const db = new QuickDB();
module.exports = {
    name: "disable-wordmoderation",
    category: "Moderation",
    description: "Disables word moderation",
    execute: async (client, message, args) => {
        if(!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('You cant do this.')
    let dbwm = await db.get('ewordm' + message.guild.id)
if(dbwm !== 1) return message.channel.send('Word moderation is not enabled')
await db.set('ewordm' + message.guild.id, 0)
  message.channel.send('Disabled word moderation')
    }
    }
