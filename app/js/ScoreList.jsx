const React = require('react');
const GameScore = require('./GameScore');

const ScoreList = React.createClass({
  propTypes: {
    scores: React.PropTypes.array
  },
  render() {
    const games = this.props.scores ? this.props.scores.map(game =>
      <GameScore
        key={game.teams.away}
        scores={game.scores}
        teams={game.teams}
      />
    ) : null;
    return (
      <div className="scoreList">
        {games}
      </div>);
  }
});

module.exports = ScoreList;
