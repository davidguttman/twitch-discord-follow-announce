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

module.exports = function followStream (channel) {
  var stream = through()

  joinStream({channels: ['#' + channel]})
    .on('data', function (login) {
      checkFollow(login, channel, function (err, doesFollow) {
        if (err) return console.error(err)

        console.log(login, 'doesFollow', channel, doesFollow)
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
    .on('join', function (channel, name, self) { !self && stream.write(name) })
    .connect()

  return stream
}

function checkFollow (fromUserName, toUserName, cb) {
  getUser(fromUserName, function (err, fromUser) {
    if (err) return cb(err)

    getUser(toUserName, function (err, toUser) {
      if (err) return cb(err)

      var fromId = _.get(fromUser, 'data.0.id')
      var toId = _.get(toUser, 'data.0.id')

      // console.log({fromId, toId})
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
  tokenCache.get(null, function (err, token) {
    if (err) return cb(err)

    var opts = {
      url: 'https://api.twitch.tv/helix/users/follows',
      headers: {Authorization: 'Bearer ' + token},
      qs: { from_id: userId, first: 100 },
      gzip: true,
      json: true
    }

    request(opts, function (err, res, body) {
      if (err) return cb(err)
      cb(null, _.get(body, 'data') || [])
    })
  })
}

function getUser (name, cb) {
  tokenCache.get(null, function (err, token) {
    if (err) return cb(err)

    var opts = {
      url: 'https://api.twitch.tv/helix/users',
      headers: {Authorization: 'Bearer ' + token},
      qs: { login: name },
      gzip: true,
      json: true
    }

    request(opts, function (err, res, body) { cb(err, body) })
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
