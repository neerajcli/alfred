# Alfred — A Modular Discord Bot

Alfred is a lightweight and extensible **Discord bot** built using **Discord.js**.  
It provides a clean, modular structure for adding commands and customizing bot behavior with ease.  
This project is designed to be beginner-friendly, simple, and fast to set up.

---

## Features

- **Modular Command System** — Every command is stored as a separate file in `commands/`
- **Simple Configuration** — All important settings inside `config.json`
- **Clean Structure** — Easy to understand and extend
- **Beginner-Friendly** — Ideal for learning Discord bot development
- **Quick Startup** — Run the bot instantly with a single command

---

## Tech Stack

- **Node.js v20**
- **Discord.js v14**
- **Quick.db v9**

---

## Installation

### Clone the repository

```bash
git clone https://github.com/neerajcli/alfred.git
cd alfred
```

### Install dependencies

```bash
npm install
```

### Configure the bot by editing `config.json`

```json
{
  "TOKEN": "YOUR BOT TOKEN HERE",
  "CLIENT_ID": "YOUR BOT CLIENT ID HERE",
  "LOG_CHANNEL_ID": "YOUR LOG CHANNEL ID HERE",
  "PREFIX": "YOUR DEFAULT PREFIX HERE",
  "TOPGG_TOKEN": "YOUR TOP.GG TOKEN HERE"
}
```

### Start the bot

```bash
node index.js
```

---

## Security Notes

- Never commit your Discord token.
- Use environment variables if hosting online.
- Keep `config.json` private.
