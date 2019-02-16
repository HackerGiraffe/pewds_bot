const { YouTube } = require("better-youtube-api");
const CONFIG = require("./config.json");
const youtube = new YouTube(CONFIG.youtube.api_key);

module.exports = {
  getStats: async () => {
    const pewdiepie = await youtube.getChannel("UC-lHJZR3Gqxm24_Vd_AJ5Yw");
    const tseries = await youtube.getChannel("UCq-Fj5jknLsUf-MWSy4_brA");
    return {
      pewdiepie: parseInt(pewdiepie.data.statistics.subscriberCount),
      tseries: parseInt(tseries.data.statistics.subscriberCount),
      difference: parseInt(
        pewdiepie.data.statistics.subscriberCount -
          tseries.data.statistics.subscriberCount
      ) //Javascript wonders
    };
  }
};
