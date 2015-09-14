
import React from 'react';

var data = require('./TEST_OUT.json');

var line = ['tab1', 'tab2', 'shared1', 'db1', 'remote', 'db2', 'shared2', 'tab3', 'tab4'];
var ixs = {};
line.forEach((name, i) => ixs[name] = i);
var width = 1400;
var part = width / line.length;

class Viz extends React.Component {
  render() {
    return <div style={styles.container}>
      <div style={styles.names}>{line.map(name => <div style={styles.name}>{name}</div>)}</div>
      {this.props.data.map(item => <Item item={item}/>)}
    </div>
  }
}


class Item extends React.Component {
  constructor(props) {
    super(props);
    this.state = {open: false};
  }

  toggleOpen() {
    this.setState({open: !this.state.open});
  }

  renderBody() {
    var item = this.props.item;
    return <div style={styles.body}>
      {JSON.stringify(item.args, null, 2) + '\n'}
      <Stack trace={item.stack}/>
    </div>
  }

  render() {
    var item = this.props.item;
    var x1 = ixs[item.fromId];
    var x2 = item.toId ? ixs[item.toId] : 100;
    var min = Math.min(x1, x2);
    var dif = item.toId ? Math.abs(x1 - x2) + 1 : 1;
    var style = {
      left: part * min,
      width: part * dif,
      backgroundColor: {
        message: '#aff',
        call: '#afa',
        reply: '#aaf',
        error: '#faa',
      }[item.type] || 'orange',
    };
    var args = item.args;
    if (item.type === 'call' && !args.length) {
      args = null;
    }
    var ball
    if (item.toId) {
      ball = <div style={x1 > x2 ? styles.leftBall : styles.rightBall}/>;
    }
    return <div style={{...styles.event, ...style}}>
      <div style={styles.eventTop} onClick={::this.toggleOpen}>
        {item.name}
        {args && '...'}
        {ball}
      </div>
      {this.state.open && this.renderBody()}
    </div>
  }
}

class Stack extends React.Component {
  constructor(props) {
    super(props);
    this.state = {open: false};
  }

  toggleOpen() {
    this.setState({open: !this.state.open});
  }

  render() {
    return <div onClick={::this.toggleOpen} style={styles.stack}>
      {this.state.open ?
        formatTrace(this.props.trace) :
        'Stack trace'}
    </div>
  }
}

function formatTrace(stack) {
  var lines = stack.split(/\n/g).slice(2);
  return lines.map(line => {
    line = line.slice('    at '.length);
    return line.replace('/Users/jared/clone/feast/', '');
  }).join('\n');
}

var styles = {
  eventTop: {
    fontFamily: 'sans-serif',
  },
  body: {
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    textAlign: 'left',
  },
  container: {
    padding: 20,
  },
  names: {
    display: 'flex',
  },
  name: {
    width: part,
    textAlign: 'center',
  },
  event: {
    backgroundColor: '#afa',
    position: 'relative',
    textAlign: 'center',
  },
  leftBall: {
    height: '1em',
    width: '1em',
    backgroundColor: '#9c9',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  rightBall: {
    height: '1em',
    width: '1em',
    backgroundColor: '#9c9',
    position: 'absolute',
    top: 0,
    right: 0,
  },
};

React.render(<Viz data={data}/>, document.body);
