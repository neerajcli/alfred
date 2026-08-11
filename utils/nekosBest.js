const axios = require("axios");

const NEKOS_BEST_HEADERS = {
  "User-Agent": "AlfredDiscordBot (https://top.gg/bot/670234327749099521)",
};

async function fetchNekosBestImage(endpoint) {
  const { data } = await axios.get(`https://nekos.best/api/v2/${endpoint}`, {
    headers: NEKOS_BEST_HEADERS,
  });
  return data.results[0].url;
}

module.exports = { fetchNekosBestImage, NEKOS_BEST_HEADERS };