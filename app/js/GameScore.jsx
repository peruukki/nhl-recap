const React = require('react');

const GameScore = React.createClass({

  propTypes: {
    scores: React.PropTypes.object.isRequired,
    teams: React.PropTypes.object.isRequired
  },

  getDelimiter() {
    const periodElement = label => <span className="period">{label}</span>;

    if (this.props.scores.overtime) {
      return periodElement('OT');
    } else if (this.props.scores.shootout) {
      return periodElement('SO');
    } else {
      return '–';
    }
  },

  render() {
    const awayTeam = this.props.teams.away;
    const homeTeam = this.props.teams.home;

    return (
      <div className="game">
        <div className="teamPanel away">
          <span className="teamName">{awayTeam}</span>
          <span className="teamScore">{this.props.scores[awayTeam]}</span>
        </div>
        <div className="delimiter">{this.getDelimiter()}</div>
        <div className="teamPanel home">
          <span className="teamScore">{this.props.scores[homeTeam]}</span>
          <span className="teamName">{homeTeam}</span>
        </div>
      </div>);
  }

});

module.exports = GameScore;
