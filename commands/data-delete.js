module.exports = {
    name: "deletemydata",
    category: "Other",
    description: "Deletes all your data. This can't be reversed.",
    execute: async (client,message,args) => { 
        const Discord = require('discord.js')
        const db = require('quick.db')
        let filter = m => m.author.id === message.author.id
    message.channel.send("Are you sure you want to delete all your data? (Kindly note this will also reset your entire progress on the bot which includes all the counters and economy status.) THIS CAN'T BE REVERSED." +  `You got 30 seconds to reply with \`YES\` / \`NO\`.`).then(() => {
      message.channel.awaitMessages(filter, {
          max: 1,
          time: 30000,
          errors: ['time']
        })
        .then(async message => {
          message = message.first()
          if (message.content.toUpperCase() === 'YES') {
              let msg = await message.channel.send('Please wait, data deletion in process. This will take a moment, please do not use any other command                   unless it is done.')
              db.delete('cash_' + message.author.id)
              db.delete('bank_' + message.author.id)
              db.delete('redeem_' + message.author.id)
              db.delete('security_' + message.author.id)
              db.delete('coin_' + message.author.id)
              db.delete('big_' + message.author.id)
              db.delete('userpremium_' + message.author.id)
           db.delete('userpremiumtime_' + message.author.id)
              let a = db.all()
              .map(entry => entry.ID)
              .filter(id => id.startsWith(`hugs_${message.author.id}`))
              a.forEach(db.delete)
              let b = db.all()
              .map(entry => entry.ID)
              .filter(id => id.startsWith(`cuddles_${message.author.id}`))
              b.forEach(db.delete)
              let c = db.all()
              .map(entry => entry.ID)
              .filter(id => id.startsWith(`slaps_${message.author.id}`))
              c.forEach(db.delete)
               let d = db.all()
              .map(entry => entry.ID)
              .filter(id => id.includes(`messages_`) && id.includes(message.author.id))
              d.forEach(db.delete)
               let e = db.all()
              .map(entry => entry.ID)
              .filter(id => id.includes(`channelmessages_`) && id.includes(message.author.id))
              e.forEach(db.delete)
              let f = db.all()

              .map(entry => entry.ID)

              .filter(id => id.includes(message.author.id))

              f.forEach(db.delete)
              setTimeout(function() {
                  msg.edit('Data deleted successufully!')
              }, 10000) 
          } else if (message.content.toUpperCase() === 'NO') {
            message.channel.send(`Cancelled data deletion request.`)
          } else {
            message.channel.send(`Terminated: Invalid Response`)
          }
        })
        .catch(collected => { console.log(collected)
            message.channel.send('Timeout');
        });
    })
        
        }
    }