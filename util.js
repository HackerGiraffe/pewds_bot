const { YouTube } = require("better-youtube-api");
const CONFIG = require("./config.json");
const youtube = new YouTube(CONFIG.youtube.api_key);

const updateListeners = [];
const cached = {
  "stats": {}
}

module.exports = {
  getStats: () => {
    return cached.stats;
  },
  updateStats: async () => {
    const pewdiepie = await youtube.getChannel("UC-lHJZR3Gqxm24_Vd_AJ5Yw");
    const tseries = await youtube.getChannel("UCq-Fj5jknLsUf-MWSy4_brA");
    const newStats = {
      pewdiepie: parseInt(pewdiepie.data.statistics.subscriberCount),
      tseries: parseInt(tseries.data.statistics.subscriberCount),
      difference: parseInt(
        pewdiepie.data.statistics.subscriberCount -
          tseries.data.statistics.subscriberCount
      ) //Javascript wonders
    };

    updateListeners.forEach((listener) => listener(newStats, cached.stats));
    return cached.stats = newStats;
  },
  addListener: (listener) => {
    updateListeners.push(listener);
  }
};
