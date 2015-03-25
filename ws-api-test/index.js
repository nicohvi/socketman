var io = require('socket.io-client')
var express = require('express');
var _ = require('lodash');

//var bomberman = io.connect('ws://mac-nicolayhvidtsten:8080/'); 
var bomberman = io.connect('ws://localhost:8080/'); 
var game = bomberman.of('/game1');
var lobby = bomberman.of('/lobby');

lobby.on('connect', function () {
  console.log('Connected to lobby');
});

lobby.on('list-games', function (listGames) {
  console.log('games: ' + JSON.stringify(listGames));
});

game.on('connect', function () {
  console.log('Connected to bomberman websocket server')
});


var gameId;
game.on('game-info', function (gameInfo) {
  gameId = gameInfo.your_id;
  console.log('game info: ' + JSON.stringify(gameInfo));
});

game.on('player-update', function (playerUpdate) {
  //console.log('player update: ' + JSON.stringify(playerUpdate));
});

game.on('player-joined', function(playerJoined) {
  console.log('player joined: ' + JSON.stringify(playerJoined));
});

game.on('laginfo', function(info) {
  //iconsole.log(info);
  game.emit('pong', { t: (new Date()).getTime() });
});

var cord = { id: gameId || 0, x: 0, y: 0 };
game.on('player-spawned', function(spawn) {
  if (spawn.id === gameId) {
    cord = spawn;
    console.log('you have spawned: ' + JSON.stringify(spawn));
  }
});

game.on('player-dying', function(d) {
  console.log(d)
});

game.on('break-tiles', function(d) {
  d.forEach(function(tile) {
    var x = tile.x;
    var y = tile.y;
    map[y][x] = 0;
  });
});

game.on('disconnect', function () {
  console.log('you were disconnected');
});

lobby.emit('list-games');
game.emit('join', { name: 'CustomWSAPI', id: 1337, character: 'mary' });
var update = _.extend(cord, { o: 3, m: false});
game.emit('update', update);

setTimeout(function() {
  game.emit('dead', { id: gameId, flameOwner: gameId})
}, 5000);

var app = express();

