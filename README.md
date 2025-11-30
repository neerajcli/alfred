# Alfred — A Modular Discord Bot

Alfred is a lightweight and extensible **Discord bot** built using **Discord.js**.  
It provides a clean, modular structure for adding commands and customizing bot behavior with ease.  
This project is designed to be beginner-friendly, simple, and fast to set up.

---

## 🚀 Features

- **Modular Command System** — Every command is stored as a separate file in `commands/`
- **Simple Configuration** — All important settings inside `config.json`
- **Clean Structure** — Easy to understand and extend
- **Beginner-Friendly** — Ideal for learning Discord bot development
- **Quick Startup** — Run the bot instantly with a single command

---

## 🛠️ Tech Stack

- **Node.js**
- **Discord.js**
- **Quick.db**

---

## 📦 Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/neerajcli/alfred.git
cd alfred
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure the bot by editing `config.json`

```json
{
    "PREFIX" : "a!",
    "TOKEN" : "YOUR BOT TOKEN HERE",
     "developers" : [ 
"YOUR DISCORD NAME"
]
}
```

### 4️⃣ Start the bot

```bash
node server.js
```

---

## 🛡️ Security Notes

- Never commit your Discord token.
- Use environment variables if hosting online.
- Keep `config.json` private.
