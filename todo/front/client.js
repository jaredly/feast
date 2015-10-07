require('babel-core/polyfill');

import {EventEmitter} from 'events';
import Tab from '../../sync/front/Tab';

import reducer from './reducer';
import * as creators from './creators';

require('debug').enable('*warn,*error')

function rebaser(actions, oldTail, newTail) {
  return actions.map(({id, action: {name}}) => ({id, action: {name: name + '+'}}));
}

const uuid = () => Math.random().toString(16).slice(2);

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
    this.state = {items: tab.state.local.items, newText: ''};
    var oldSet = tab.setState;
    tab.setState = (state, type) => {
      this.setState({items: state.local.items});
      oldSet.call(tab, state, type);
    };
  }

  setCompleted(id, completed) {
    tab.addAction(creators.update(id, {completed}));
  }

  add() {
    if (!this.state.newText.length) return;
    const {newText} = this.state;
    this.setState({newText: ''});
    const id = uuid();
    tab.addAction(creators.add(id, newText));
  }

  render() {
    const {items} = this.state;
    const ids = Object.keys(items);
    return <div>
      State!
      <ul style={styles.list}>
        {ids.map(id => <li>
          <label style={styles.item}>
            <input
              type="checkbox"
              onClick={() => this.setCompleted(id, !items[id].completed)}
              checked={items[id].completed}
            />
            <span style={styles.text}>{items[id].text}</span>
          </label>
        </li>)}
      </ul>
      <input
        onKeyDown={e => (e.key === 'Enter' ? this.add() : null)}
        onChange={e => this.setState({newText: e.target.value})}
        value={this.state.newText}
      />
    </div>;
  }
}

const styles = {
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  text: {
    paddingLeft: 10,
    display: 'inline-block',
  },

  item: {
    padding: '5px 10px',
    display: 'inline-block',
    cursor: 'pointer',
  },
};

window.ttab = tab;

tab.init().then(() => {
  React.render(<App/>, document.body);
});
