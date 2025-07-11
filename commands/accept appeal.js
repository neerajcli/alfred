const Discord = require('discord.js')
const db = require('quick.db')
module.exports = {
    name: "accept-appeal",
    description: "Accept an appeal",
    execute: async (client, message, args) => {
        if(message.author.id !== '504635146553524234') return message.channel.send('Only bot devs can use this command')
        if(message.channel.id !== '1327903156956561439') return message.channel.send('Please use command in appeals channel')
        if(!args[0]) return message.channel.send('Please provide id whose appeal you want to reject')
let appealtype = await db.fetch('appealtype_' + args[0]);
        if(appealtype == "u") {
        const user = client.users.cache.get(args[0])
        if(!user) return message.channel.send('Invalid user')
         let reason = args.slice(1).join(" ");
        user.send(`Your appeal for blacklist has been accepted. Make sure to follow our rules this time.`);
        message.channel.send(`You have accepted blacklist appeal of ${args[0]}.`)
        await db.delete('appealed_'+args[0]);
        await db.delete(`utime_${args[0]}`,Date.now());
         await db.delete('appealtype_' + args[0]);
           await db.set("bl_" + args[0], null)
		await db.set('blreason_' + args[0], null)
		await db.set('bltime_' + args[0], null)
            db.delete('tappealed_'+args[0])
        } else if(appealtype == "s") {
        let todm = await db.fetch('dmres_' + args[0]);
        const user = client.users.cache.get(todm)
        if(!user) return message.channel.send('Invalid user')
        let reason = args.slice(1).join(" ");
        user.send(`Your appeal for server blacklist has been accepted. Make sure to follow our rules now.`);
        message.channel.send(`You have accepted server blacklist appeal of ${args[0]}.`)
        await db.delete('sappealed_'+args[0]);
        await db.delete(`stime_${args[0]}`,Date.now());
         await db.delete('appealtype_' + args[0]);
           await db.set("blguild_" + args[0], null)
    await db.set('blguildtime_' + args[0], null)
         await  db.set('blguildreason_' + args[0], null)
            db.delete('stappealed_'+args[0])
                        db.delete('dmres_' +args[0]);
        } else {
            return message.channel.send("Invalid Appeal");
        }
        }
    }