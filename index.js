var name = require('./package.json').name
require('productionize')(name)

var config = require('./config')
var server = require('./server')
var announce = require('./server/announce')

var port = process.env.PORT || 5000
server().listen(port)
console.log(name, 'listening on port', port)

announce(config.twitch.channel, config.discord.channel)
