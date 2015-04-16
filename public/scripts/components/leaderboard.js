var React = require('react');
var $     = require('jquery');

var Leaderboard = require('./Leaderboard.react');
// TODO: remember state
var LeaderBoardLoader = {
  load: function (players) {
    React.render(<Leaderboard players={players} />, document.getElementById("leaderboard-component"));
  }
};


module.exports = LeaderBoardLoader;
