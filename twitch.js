var _ = {get: require('lodash.get')}
var tmi = require('tmi.js')
var request = require('request')
var through = require('through2').obj
var AsyncCache = require('async-cache')

var config = require('./config.json').twitch

var tokenCache = new AsyncCache({
  maxAge: 36e5,
  load: function (id, cb) { getToken(config, cb) }
})

var userCache = new AsyncCache({
  maxAge: 36e5,
  load: getUserId
})

module.exports = function followStream (channel) {
  var stream = through()

  joinStream({channels: ['#' + channel]})
    .on('data', function (login) {
      checkFollow(login, channel, function (err, doesFollow) {
        if (err) return console.error(err)

        stream.write({
          fromUser: login,
          toUser: channel,
          doesFollow: doesFollow
        })
      })
    })

  return stream
}

// // // // //

function joinStream (opts) {
  var stream = through()

  var options = {
    options: { debug: true },
    connection: { reconnect: true },
    channels: opts.channels
  }

  var Client = tmi.client
  new Client(options)
    .on('join', onJoin)
    .connect()

  return stream

  function onJoin (channel, name, self) { if (!self) stream.write(name) }
}

function checkFollow (fromUserName, toUserName, cb) {
  userCache.get(fromUserName, function (err, fromId) {
    if (err) return cb(err)

    userCache.get(toUserName, function (err, toId) {
      if (err) return cb(err)

      getFollows(fromId, function (err, follows) {
        if (err) return cb(err)

        var doesFollow = !!follows.filter(function (follow) {
          return follow.to_id === toId
        })[0]

        cb(null, doesFollow)
      })
    })
  })
}

function getFollows (userId, cb) {
  var opts = { from_id: userId, first: 100 }
  getTwitch('users/follows', opts, function (err, body) {
    if (err) return cb(err)
    cb(null, _.get(body, 'data') || [])
  })
}

function getUserId (name, cb) {
  getTwitch('users', {login: name}, function (err, body) {
    if (err) return cb(err)
    cb(null, _.get(body, 'data.0.id'))
  })
}

var lastFetch = 0
function getTwitch (path, opts, cb) {
  tokenCache.get(null, function (err, token) {
    if (err) return cb(err)

    var rOpts = {
      url: 'https://api.twitch.tv/helix/' + path,
      headers: {Authorization: 'Bearer ' + token},
      qs: opts,
      gzip: true,
      json: true
    }

    var timeSinceLastFetch = Date.now() - lastFetch
    var wait = 500 - timeSinceLastFetch
    if (wait < 0) wait = 0
    lastFetch = Date.now() + wait

    setTimeout(function () {
      request(rOpts, function (err, res, body) { cb(err, body) })
    }, wait)
  })
}

function getToken (config, cb) {
  var opts = {
    url: 'https://api.twitch.tv/kraken/oauth2/token',
    gzip: true,
    json: true,
    qs: {
      client_id: config.id,
      client_secret: config.secret,
      grant_type: 'client_credentials'
    }
  }

  request.post(opts, function (err, res, body) {
    cb(err, body.access_token)
  })
}
