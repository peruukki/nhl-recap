const React = require('react');

const GameScore = React.createClass({
  propTypes: {
    scores: React.PropTypes.object.isRequired,
    teams: React.PropTypes.array.isRequired
  },
  render() {
    const awayTeam = this.props.teams[0];
    const homeTeam = this.props.teams[1];
    return (
      <div className="game">
        {awayTeam} {this.props.scores[awayTeam]} – {this.props.scores[homeTeam]} {homeTeam}
      </div>);
  }
});

module.exports = GameScore;
