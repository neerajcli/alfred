const discord = require("discord.js");
const got = require("got");

module.exports = {
  name: "food",
  category: "Image",
  description: "Sends a random yummy food picture",
  usage: "food",
  execute: async (client, message, args) => {
    got("https://foodish-api.com/api/")
      .then(response => {
        let content = JSON.parse(response.body);
        let foodImage = content.image;

        const foodEmbed = new discord.MessageEmbed()
          .setColor("#FFFFFF")
          .setTitle("Yum!")
          .setImage(foodImage);

        message.channel.send(foodEmbed);
      })
      .catch(console.error);
  }
};