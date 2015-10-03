require('babel-core/polyfill');

import {EventEmitter} from 'events';
import Tab from '../../sync/front/Tab';

import reducer from './reducer';

require('debug').enable('*warn,*error')

function rebaser(actions, oldTail, newTail) {
  return actions.map(({id, action: {name}}) => ({id, action: {name: name + '+'}}));
}

var worker = new SharedWorker('./build/shared.js');
window.shared_worker = worker
worker.onerror = err => console.log('Shared worker failed to start', err);
var shared = new EventEmitter();
worker.port.onmessage = e => {console.log('from shared', e.data); shared.emit('message', e.data);};
shared.send = data => {console.log('to shared', data); worker.port.postMessage(data);};


var tab = new Tab(shared, reducer, rebaser);

import React from 'react';

class App extends React.Component {
  constructor() {
    super();
    this.state = tab.state.local;
    var oldSet = tab.setState;
    tab.setState = (state, type) => {
      this.setState(state.local);
      oldSet.call(tab, state, type);
    };
  }

  render() {
    return <div>
      State!
      <pre>{JSON.stringify(this.state, null, 2)}</pre>
    </div>;
  }
}

window.ttab = tab;

tab.init().then(() => {
  React.render(<App/>, document.body);
});
