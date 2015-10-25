const React = require('react');
const ScoreList = require('./ScoreList');

require('es6-promise');
require('whatwg-fetch');

const ScorePanel = React.createClass({
  getInitialState() {
    return { scores: null, status: 'Fetching latest scores...' };
  },
  componentDidMount() {
    fetch('https://nhlscoreapi-peruukki.rhcloud.com/api/scores/latest')
      .then(this.throwOnHTTPErrorStatus)
      .then(res => res.json())
      .then(res => {
        if (this.isMounted()) {
          this.setState({ scores: res, status: null });
        }
      })
      .catch(err => this.setState({ status: `Failed to fetch latest scores: ${err.message}` }));
  },
  throwOnHTTPErrorStatus(res) {
    if (res.status >= 200 && res.status < 300) {
      return res;
    } else {
      throw new Error(res.statusText);
    }
  },
  render() {
    return (
      <div className="scorePanel">
        <ScoreList scores={this.state.scores} />
        <div className="status">{this.state.status}</div>
      </div>);
  }
});

module.exports = ScorePanel;
