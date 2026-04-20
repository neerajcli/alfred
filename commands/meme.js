module.exports = {
  name: "meme",
  description: "Have some fun with memes.",
  category: "Fun",
  execute: async (client, message, args) => {
    const Discord = client.discord;
    const got = require("got");
    const embed = new Discord.MessageEmbed();
    got("https://meme-api.com/gimme/dankmemes").then(response => {
      let content = JSON.parse(response.body);
      let memeUrl = content.postLink;
      let memeImage = content.url;
      let memeTitle = content.title;
      let memeUpvotes = content.ups;
      embed.addField(`${memeTitle}`, `[View thread](${memeUrl})`);
      embed.setImage(memeImage);
      embed.setFooter(`
       👍 ${memeUpvotes} | Credits to dankmemes
       `);
      embed.setColor("RANDOM");
      message.channel.send(embed);
    });
  }
};