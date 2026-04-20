module.exports = {
  name: "deletemydata",
  category: "Other",
  description: "Deletes all your data. This can't be reversed.",
  execute: async (client, message, args) => {
    const db = client.db;
    const authorId = message.author.id;
    let filter = m => m.author.id === message.author.id
    message.channel.send("Are you sure you want to delete all your data? (Kindly note this will also reset your entire progress on the bot which includes all the counters and economy status.) THIS CAN'T BE REVERSED." + `You got 30 seconds to reply with \`YES\` / \`NO\`.`).then(() => {
      message.channel.awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ['time']
      })
        .then(async message => {
          message = message.first()
          if (message.content.toUpperCase() === 'YES') {
            let msg = await message.channel.send('Please wait, data deletion in process. This will take a moment, please do not use any other command unless it is done.')
            let d = await db.all()

            let keys = d.map(entry => entry.id)

              .filter(id => id.includes(authorId))

            for (const key of keys) {
              await db.delete(key);
            }

            setTimeout(function () {
              msg.edit('Data deleted successufully!')
            }, 10000)
          } else if (message.content.toUpperCase() === 'NO') {
            message.channel.send(`Cancelled data deletion request.`)
          } else {
            message.channel.send(`Terminated: Invalid Response`)
          }
        })
        .catch(collected => {
          console.log(collected)
          message.channel.send('Timeout');
        });
    })

  }
}