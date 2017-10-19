var discord = require('./discord')
var followStream = require('./twitch')

followStream('barbarousking')
  .on('data', function (data) {
    discord(`${data.fromUser} ${data.doesFollow ? 'follows' : 'does NOT follow'} ${data.toUser}`)
  })
