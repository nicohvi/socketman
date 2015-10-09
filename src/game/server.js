/*jslint node: true */
"use strict";

const _ = require('lodash');

let game = require('./game')(),
    views = {},
    viewSocket = null,
    playerSocket = null,
    viewId = 1,
    playerId = viewId;

let Server = {
  init (io) {

    io.set('log level', 1);

    viewSocket = io.of('/view');
    viewSocket.on('connection', this.onViewConnection.bind(this));

    playerSocket = io.of('/game');
    playerSocket.on('connection', this.onPlayerConnection.bind(this));
   
    game.init();
    this.setupGameListeners();
  },

  startGameRound () {
    console.log('start-round');
    game.startNewRound();
  },

  setupGameListeners: function () {
    game.onMany( 
      [ 'player-join', 'player-spawn', 'player-update', 
        'player-die', 'bomb-place', 'bomb-explode', 
        'flames-spawn', 'map-update', 'player-score',
        'flames-die', 'game-over', 'player-leave'],
      this.viewUpdate.bind(this));
  },
  
  onViewConnection: function (socket) {
    console.log('view connected');

    let id = viewId++;
    views[id] = socket;

    socket.emit('game-info', { game: game.state() } );

    socket.on('disconnect', () => { 
      console.log('disconnect');
      delete views[id];
    });

    socket.on('start-round', game.startRound);
    socket.on('end-round', game.endRound); 
  },

  onPlayerConnection: function (socket) {
    console.log('player connected');
    let id = -1;
    
    socket.on('join-game', data => {
      id = playerId++; 
      console.log('player ' +data.name+ ' joining the game with id: '+ id);
      game.addPlayer(_.assign({ id: id }, data));
      socket.emit('joined-game', { id: id });
    });
    
    socket.on('request-move', data => {
      game.movePlayer(_.assign({ id: id }, data));
    });

    socket.on('stop-move', () => {
      game.stopPlayer(id);
    });

    socket.on('place-bomb', () => {
      game.placeBomb(id);
    });

    socket.on('disconnect', () => {
      console.log('socket: ' +id+ ' disconnected');
      game.removePlayer(id); 
    });
  },

  viewUpdate: function (event, payload) {
    if(event !== 'player-update') {
      console.log('called event: ' +event);
    }
    _.forEach(views, function (view) {
      view.emit(event, payload);
   });
  },

};

module.exports = Server;
