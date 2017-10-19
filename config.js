require('dotenv').config()

module.exports = {
  twitch: {
    id: process.env.TWITCH_ID,
    secret: process.env.TWITCH_SECRET,
    channel: process.env.TWITCH_CHANNEL
  },
  discord: {
    token: process.env.DISCORD_TOKEN,
    channel: process.env.DISCORD_CHANNEL
  }
}
