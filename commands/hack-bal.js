const { QuickDB } = require('quick.db');
const ms = require('ms');
const db = new QuickDB();

module.exports = {
    name: "hack-bal",
    category: "Economy",
    description: "Hack another user's bank and transfer all their bank money and redeems to your account if you know their password",
    usage: "<@user> (password)",
    execute: async(client,message,args) => {
        if(message.author.bot) return;
        const authorpass = await db.get('econpass_' + message.author.id);
        if(authorpass == null) return message.channel.send("Please create your bank password using `+reset-pass` to use this command");
        const user = message.mentions.members.first();
        if(!user) return message.channel.send("Please mention someone to hack.")
        if(user.id == "504635146553524234" || user.id == "670234327749099521") return message.channel.send("You cant hack this user.")
        if(user.bot) return message.channel.send("You cant hack a bot.");
        if(message.author.id == user.id) return message.channel.send("You cant hack yourself");
        let password = args.slice(1).join(" ");
        if(!password) return message.channel.send("Please provide password of the person you are hacking. Correct usage +hack-bal @user password");
        const userPass = await db.get('econpass_'+user.id);
        const msg = await message.channel.send(`Attempting to breach into <@${user.id}>'s account. Please wait....`)
        if(password==userPass) {
            let bankbal = await db.get(`bank_${user.id}`);
            if(bankbal<0) bankbal = 0;
            let redeemavl = await db.get(`redeem_${user.id}`);
            if(redeemavl<0) redeemavl = 0
            await db.add('bank_' + message.author.id, bankbal);
            await db.add('redeem_' + message.author.id, redeemavl);
            await db.set("bank_" + user.id,0)
            await db.set('redeem_' + user.id, 0);
            let timesuccess = '7s';
            setTimeout(function() {
                msg.edit(`**__Authentication Successful!__**\nSuccessfully breached into <@${user.id}>'s account and stole $${bankbal} and ${redeemavl} redeems.`)
            },ms(timesuccess));
            user.send("**__Bank Alert__**\nYour account has been breached. Please reset your password using `+reset-pass` in any server.");
        } else {
            let timefail = '5s';
            setTimeout(function() {
                msg.edit(`**__Authentication Error!__**\nFailed to breach into <@${user.id}>'s account.\n**Reason:** Incorrect Password`);
            }, ms(timefail));
        }
    }
}