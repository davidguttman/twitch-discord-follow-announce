var _ = {get: require('lodash.get')}
var tmi = require('tmi.js')
var request = require('request')
var through = require('through2').obj

var config = require('./config.json').twitch

var clientId = config.id
var clientSecret = config.secret

module.exports = function followStream (channel) {
  var stream = through()

  getToken(function (err, token) {
    if (err) return console.error(err)

    joinStream({channels: ['#' + channel]})
      .on('data', function (login) {
        checkFollow(token, login, channel, function (err, doesFollow) {
          if (err) return console.error(err)

          console.log(login, 'doesFollow', channel, doesFollow)
          stream.write({
            fromUser: login,
            toUser: channel,
            doesFollow: doesFollow
          })
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

function checkFollow (token, fromUserName, toUserName, cb) {
  getUser(token, fromUserName, function (err, fromUser) {
    if (err) return cb(err)

    getUser(token, toUserName, function (err, toUser) {
      if (err) return cb(err)

      var fromId = _.get(fromUser, 'data.0.id')
      var toId = _.get(toUser, 'data.0.id')

      // console.log({fromId, toId})

      var opts = {
        url: 'https://api.twitch.tv/helix/users/follows',
        headers: {Authorization: 'Bearer ' + token},
        qs: { from_id: fromId },
        gzip: true,
        json: true
      }

      request(opts, function (err, res, body) {
        if (err) return cb(err)

        var doesFollow = false
        var follows = _.get(body, 'data') || []
        follows.forEach(function (follow) {
          // console.log({follow})
          if (follow.to_id === toId) doesFollow = true
        })

        cb(null, doesFollow)
      })
    })
  })
}

function getUser (token, name, cb) {
  var opts = {
    url: 'https://api.twitch.tv/helix/users',
    headers: {Authorization: 'Bearer ' + token},
    qs: { login: name },
    gzip: true,
    json: true
  }

  request(opts, function (err, res, body) { cb(err, body) })
}

function getToken (cb) {
  var opts = {
    url: 'https://api.twitch.tv/kraken/oauth2/token',
    gzip: true,
    json: true,
    qs: {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    }
  }

  request.post(opts, function (err, res, body) {
    cb(err, body.access_token)
  })
}
