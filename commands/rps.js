module.exports = {
name: "rps",
description: "Rock, Paper, Scissors",
category: "Fun",
execute: async (client, message, args) => {
    
let rps = ["scissors", "paper", "rock"];
let i;
if(!rps.includes(args[0].toLowerCase())) return message.reply("Please choose rock, paper or scissors.");
   const myChoice = args[0].toLowerCase()
let comp = Math.floor((Math.random() * 3) + 1);
let comp_res = parseInt(comp) - parseInt("1");
let comp_val = rps[parseInt(comp_res)];
    const comp_choice = comp_val.toLowerCase()
  if(myChoice === comp_choice) {
    return message.channel.send(`You chose **${args[0]}** and I chose **${comp_val}** and we tied, wanna try again?`); 
  }
  if(myChoice === "rock" && comp_choice === "paper") {
    return message.channel.send(`You chose **${args[0]}** and I chose **${comp_val}** and I won! Well played.`);
  } 
  if(myChoice === "rock" && comp_choice === "scissors") {
    return message.channel.send(`You chose **${args[0]}** and I chose **${comp_val}** and I lost! Congrats on winning!`); 
  }
      
     if(myChoice === "paper" && comp_choice === "scissors") {
    return message.channel.send(`You chose **${args[0]}** and I chose **${comp_val}** and I won! Well played.`);
  } 
  if(myChoice === "paper" && comp_choice === "rock") {
    return message.channel.send(`You chose **${args[0]}** and I chose **${comp_val}** and I lost! Congrats on winning!`);
        }
    if(myChoice === "scissors" && comp_choice === "rock") {
    return message.channel.send(`You chose **${args[0]}** and I chose **${comp_val}** and I won! Well played.`);
  } 
  if(myChoice === "scissors" && comp_choice === "paper") {
    return message.channel.send(`You chose **${args[0]}** and I chose **${comp_val}** and I lost! Congrats on winning!`);  
  }
}
}