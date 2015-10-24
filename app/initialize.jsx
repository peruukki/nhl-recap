var React = require('react');

var HelloWorld = React.createClass({
  render: function() {
    return <h2>Hello world</h2>;
  }
});

React.render(<HelloWorld />, document.getElementById('content'));
