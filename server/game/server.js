TILE_EMPTY = 0;
TILE_BRICK = 1;
TILE_SOLID = 2;

SPAWNING_TIME = 5000;
_ = require('underscore')._;
Backbone = require('backbone');
var util = require('util');
var assign = require('object-assign');

var redis;

require('./game.js');

var Server = Backbone.Model.extend({

    initialize: function(opt) {
        var io = opt.io;
        this.socketId = 1;
        redis = opt.redis;
        this.views = [];
        if (redis) {
            redis.incr("counters.restarts");
            redis.set("stats.last-start-time", (new Date()).getTime());
        }
        io.set('log level', 1);
        
        this.game = new Game({ redis: redis });
        this.game.on('player-spawn', this.playerSpawned.bind(this));
        this.game.on('player-update', this.playerUpdate.bind(this));
        this.game.on('bomb-explode', this.bombExplode.bind(this));

        this.view = io.of('/view');
        this.view.on('connection', this.onViewConnection.bind(this));

        this.playerSocket = io.of('/game');
        this.playerSocket.on('connection', this.onPlayerConnection.bind(this));
  
    },

    // View connects the socket, receives inital game information
    // and is subscribed for future updates.
    onViewConnection: function (socket) {
      this.views.push(socket);
      console.log('view connected');
      
      socket.emit('game-info', { game: this.game.getState() } );

      socket.on('ping', function () { 
        socket.emit('pong') 
      }.bind(this) );

      socket.on('disconnect', function () { 
        console.log('disconnect');
        this.views.splice(this.views.indexOf(socket)); 
      }.bind(this) );
      
    }, 

    onPlayerConnection: function (socket) {
      console.log('player connected');
      var socketId = -1;
      
      socket.on('join-game', function (data) {
        socketId = this._generateSocketId();
        console.log('player ' +data.name+ ' joining the game.');
        var player = this.game.addPlayer(assign({ socketId: socketId }, data));
        socket.emit('joined-game', { player: player });
        this.playerJoined(player);
        this.game.spawnPlayer(player);
      }.bind(this));

      socket.on('request-move', function (data) {
        var player = this.game.playerMove(socketId, data);
        this.playerUpdate(player);
      }.bind(this));

      socket.on('stop-move', function () {
        var player = this.game.playerStop(socketId);
        this.playerUpdate(player);
      }.bind(this))

      socket.on('place-bomb', function () {
        var bomb = this.game.placeBomb(socketId);
        this.bombPlaced(bomb);
      }.bind(this));

      socket.on('disconnect', function () {
        console.log('socketId: ' +socketId+ ' disconnected');
        this.game.removePlayer(socketId); 
        this.playerLeft(socketId);
      }.bind(this));
    },

    _viewUpdate: function (event, payload) {
      var payload = payload || {};
      _.each(this.views, function (view) {
        view.emit(event, payload);
        if(!event == 'player-update')
          console.log("Emitting " +event);
     });
    },

    playerJoined: function (player) {
      this._viewUpdate('player-join', { player: player});
    },

    playerLeft: function (id) {
      this._viewUpdate('player-leave', { id: id });
    },
    
    playerSpawned: function (data) {
      this._viewUpdate('player-spawn', { player: data });
    },

    playerUpdate: function (player) {
      if(player == null) return;
      this._viewUpdate('player-update', { player: player });
    },

    bombPlaced: function (bomb) {
      if(bomb == null) return;
      this._viewUpdate('bomb-place', { bomb: bomb });
    },

    bombExplode: function (data) {
      this._viewUpdate('bomb-explode',{ state: data });
    },

    _generateSocketId: function () {
      return this.socketId++;
    }

});

       //console.log('lobby connection');
      //socket.emit('connect');
      //socket.on('join-game', function (data) {
        //console.log(util.inspect(data));
        //console.log('joining game');
        //this.game.addPlayer(data);        
        
        //socket.emit('game-info', {
          //game: this.game,
          //player: _.last(this.game.players)
        //});

      //}.bind(this));
      
      //socket.on('request-move', function (data) {
        //console.log('move requested');
        //this.game.playerMove(data);
      //}.bind(this));

      //socket.on('disconnect', function (data) {
        //console.log('disconnect');
        //this.game.removePlayer(data);
      //}.bind(this));
    //},

    //lobbyConnection: function(socket) {

        //socket.on('list-games', _.bind(function(d) {
            //socket.emit("list-games", {
                //"game1": {
                    //type: "free",
                    //count: global.counters.players
                //}
            //});
        //}, this));

    //},

    //connection: function(socket) {
        //global.counters.players++;

        //// generate id
        //var playerId = this.game.generatePlayerId();

        //// send game info
        //socket.emit('game-info', {
            //game: "demo1",
            //ver: 1,
            //your_id: playerId
        //});

        //// wait for join
        //socket.on('join', _.bind(function(d) {
            //var name = d.name;

            //if (redis)
                //redis.incr("counters.joined-players");

            //// create new player
            //var me = new Player({
                //id: playerId,
                //name: d.name,
                //character: d.character,
                //fbuid: d.fbuid
            //});
        
            //this.game.playersById[playerId] = me;

            //// setup a player controller
            //var ctrl = new PlayerController({
                //id: playerId,
                //player: me,
                //game: this.game, // TODO joined game
                //socket: socket,
                //view: this.view,
                //endpoint: this.endpoint
            //});

            //this.game.ctrlsById[playerId] = ctrl;

            //ctrl.on('disconnect', _.bind(function() {
                //console.log('player left yo');
                //delete this.game.playersById[playerId];
                //delete this.game.ctrlsById[playerId];


                //// FIXME D.R.Y.
                //_.each(this.game.ctrlsById, function(ctrl, id) {
                    //if (id == playerId) return;
                    //ctrl.notifyFriendBattles();
                //});

                //global.counters.players--;
            //}, this));

            //console.log("+ " + name + " joined the game " + d.fbuid);

            //// notify everyone about my join
            //socket.broadcast.emit('player-joined', me.getInitialInfo());           
            //this.view.emit('player-joined', me.getInitialInfo());

            //// update me about the current game state
            //ctrl.notifyGameState();

            //_.each(this.game.ctrlsById, function(ctrl, id) {
                //if (id == playerId) return;
                //ctrl.notifyFriendBattles();
            //});
        //}, this));

    //},

    //onBombRemoved: function(b) {
////            console.log('exploding bomb at ' + b.get('x') + "," + b.get('y'));

        //this.endpoint.emit('bomb-boomed', {
            //x: b.get('x'),
            //y: b.get('y'),
            //strength: b.get('strength')
        //});
    //},

    //notifyScoreUpdates: function() {
        //var scoring = {};
        //_.each(this.game.playersById, function(p,id) {
            //scoring[id] = p.get('score');
        //});

        //// why not boat?
        //this.view.emit('score-updates', scoring);
        //this.endpoint.emit('score-updates', scoring);
    //}


        //this.playerSocket.on('connection', this.onPlayerConnection.bind(this));

        //this.game.bombs.on('remove', this.onBombRemoved, this);

        //this.game.on('score-changes', _.debounce(this.notifyScoreUpdates, 50), this);

        //this.lobbySocket = io.of('/lobby');
        //this.lobbySocket.on('connection', this.onLobbyConnection.bind(this));

        //this.endpoint = io.of('/game');
        //this.endpoint.on('connection', _.bind(this.connection, this));

        //this.view = io.of('/view');
        //this.view.on('connection', this.viewConnection.bind(this));

        //this.game.endpoint = this.endpoint;

        //this.lobby = io.of('/lobby');
        //this.lobby.on('connection', _.bind(this.lobbyConnection, this));
 
module.exports = Server;
