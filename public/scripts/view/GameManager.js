var io = require('socket.io-client');
var Game = require('./Game');

var GameManager = {

  init: function () {
    this.socket = io.connect('/view'); 
    this.setupListeners.call(this);
    //setInterval(function () { this.socket.emit('ping') }.bind(this), 1000);
  },

  setupListeners: function() {
    this.socket.on('game-info', this.onGameInfo.bind(this));
    this.socket.on('player-join', this.onPlayerJoin.bind(this));
    this.socket.on('player-leave', this.onPlayerLeave.bind(this));
    this.socket.on('player-spawn', this.onPlayerSpawn.bind(this));
    this.socket.on('player-update', this.onPlayerUpdate.bind(this));
    this.socket.on('player-die', this.onPlayerDie.bind(this));
    this.socket.on('bomb-place', this.onBombPlace.bind(this));
    this.socket.on('bomb-explode', this.onBombExplode.bind(this));
    this.socket.on('pong', this.onPong.bind(this));
  },

  onGameInfo: function (data) {
    Game.init(data.game);
  },

  onPlayerJoin: function (data) {
    Game.playerJoin(data.player);
  },

  onPlayerLeave: function (data) {
    Game.playerLeave(data.id);
  },

  onPlayerSpawn: function (data) {
    Game.playerSpawn(data.player);
  },
  
  onPlayerUpdate: function (data) {
    Game.playerUpdate(data.player);
  },

  onPlayerDie: function (data) {
    Game.playerDie(data.player);
  },

  onBombPlace: function (data) {
    Game.bombPlace(data.bomb);
  },

  onBombExplode: function (data) {
    Game.bombExplode(data.state);
  },

  onPong: function () {
    console.log('pong');
  },

};

module.exports = GameManager;
