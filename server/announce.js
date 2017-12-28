var discord = require('./discord')
var followStream = require('./twitch')

module.exports = function (stream, channel) {
  var sendMessage = discord(channel)

  return followStream(stream)
    .on('error', console.error)
    .on('data', function (data) {
      console.log('data', data)
      if (data.doesFollow) return

      sendMessage(`Possibly New Viewer: **${data.fromUser}**`)
    })
}
