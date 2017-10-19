var Discord = require('discord.io')
var through = require('through2').obj

var config = require('../config').discord

module.exports = function (channel) {
  var stream = through()

  var bot = new Discord.Client({
    token: config.token,
    autorun: true
  })

  bot.on('ready', function () {
    console.log('Logged in as %s - %s\n', bot.username, bot.id)

    stream.on('data', function (msg) {
      console.log('msg', msg)
      bot.sendMessage({
        to: channel,
        message: msg
      })
    })
  })

  return function (msg) { stream.write(msg) }
}
