const YouTube = require('simple-youtube-api')
const CONFIG = require('./config.json')
const youtube = new YouTube(CONFIG.youtube.api_key)

const updateListeners = []
const cached = {
  stats: {}
}

module.exports = {
  getStats: () => {
    return cached.stats
  },
  updateStats: async () => {
    const pewdiepie = await youtube.getChannelByID('UC-lHJZR3Gqxm24_Vd_AJ5Yw', { part: 'statistics' })
    const tseries = await youtube.getChannelByID('UCq-Fj5jknLsUf-MWSy4_brA', { part: 'statistics' })
    const newStats = {
      pewdiepie: parseInt(pewdiepie.subscriberCount),
      tseries: parseInt(tseries.subscriberCount),
      difference: parseInt(
        pewdiepie.subscriberCount -
          tseries.subscriberCount
      ) // Javascript wonders
    }
    updateListeners.forEach((listener) => listener(newStats, cached.stats))
    return cached.stats = newStats;
  },
  addListener: (listener) => {
    updateListeners.push(listener)
  }
}
