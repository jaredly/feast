/**
 * Currently only called manually. just for initial population of the
 * scripture text
 */

import db from './db';
import React from 'react';
import assign from 'object-assign';

export default function () {
  var node = document.createElement('div');
  assign(node.style, {
    position: 'absolute',
    top: '20px',
    left: '20px',
  });
  document.body.appendChild(node);
  React.render(<Thinger />, node);
}

class Thinger extends React.Component {
  constructor() {
    super()
    this.state = {total: 10, gotten: 5};
  }

  componentDidMount() {
    doot(total => this.setState({total}),
         gotten => this.setState({gotten}));
  }

  render() {
    return <progress max={this.state.total} value={this.state.gotten} />;
  }
}

function doot(onNum, onTick) {
  var num = null
  var got = 0;
  connect(msg => {
    if (num === null) {
      num = msg.num;
      onNum(num);
      console.log('getting', num, 'items');
      return;
    }
    got += 1;
    onTick(got);
    db[msg.table].add(msg.data);
  });
}

function connect(fn) {
  var ws = new WebSocket('ws://localhost:7331')

  ws.onmessage = evt => {
    var data = JSON.parse(evt.data);
    fn(data);
  };

  ws.onerror = err => {
    console.log('failed websocket', err);
  };

  ws.onclose = () => console.error('ws closed');
}
