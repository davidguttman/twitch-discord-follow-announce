var Discord = require('discord.io')
var through = require('through2').obj

var config = require('./config.json').discord

const myChannelId = '370390734249000973'

var stream = through()

module.exports = function (msg) { stream.write(msg) }

var bot = new Discord.Client({
  token: config.token,
  autorun: true
})

bot.on('ready', function () {
  console.log('Logged in as %s - %s\n', bot.username, bot.id)

  stream.on('data', function (msg) {
    bot.sendMessage({
      to: myChannelId,
      message: msg
    })
  })
})
