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
        <div className="teamPanel away">
          <span className="teamName">{awayTeam}</span>
          <span className="teamScore">{this.props.scores[awayTeam]}</span>
        </div>
        <div className="delimiter">–</div>
        <div className="teamPanel home">
          <span className="teamScore">{this.props.scores[homeTeam]}</span>
          <span className="teamName">{homeTeam}</span>
        </div>
      </div>);
  }
});

module.exports = GameScore;
