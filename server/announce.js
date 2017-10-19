var discord = require('./discord')
var followStream = require('./twitch')

var suffixes = [
  'say hi 👋',
  'are they working on anything interesting?',
  'where do they live?',
  'how did they find the channel?',
  'what games are they currently playing?',
  'what\'s the story behind their nickname?',
  'do they have any favorite gdq runs?'
]

module.exports = function (stream, channel) {
  var sendMessage = discord(channel)

  return followStream(stream)
    .on('error', console.error)
    .on('data', function (data) {
      console.log('data', data)
      if (data.doesFollow) return
      var suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
      sendMessage(`**${data.fromUser}** is probably new, ${suffix}`)
    })
}
