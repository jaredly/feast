require('babel-core/polyfill');

// Enable this for fuzz testing
import './enable-debug';
import {EventEmitter} from 'events';
import Tab from '../../sync/front/Tab';

import reducer from './reducer';
import * as creators from './creators';

function rebaser(actions, oldTail, newTail) {
  return actions;
}

const uuid = () => Math.random().toString(16).slice(2);

var worker = new SharedWorker('./build/shared.js');
window.shared_worker = worker
worker.onerror = err => console.log('Shared worker failed to start', err);
var shared = new EventEmitter();
worker.port.onmessage = e => {
  console.log('from shared', e.data);
  try {
    shared.emit('message', e.data);
  } catch (e) {
    console.log('failed', e, e.stack);
  }
};
shared.send = data => worker.port.postMessage(data);


var tab = new Tab(shared, reducer, rebaser);

import React from 'react';

class App extends React.Component {
  constructor() {
    super();
    this.state = {items: (tab.state.local || {}).items, newText: ''};
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

  clear() {
    Object.keys(tab.state.local.items).map(id => this.remove(id));
  }

  async kill() {
    await new Dexie('todo-stampy').delete();
    location.reload();
  }

  remove(id) {
    tab.addAction(creators.remove(id));
  }

  render() {
    const {items} = this.state;
    const ids = items ? Object.keys(items) : [];
    ids.sort();
    return <div>
      {/*
      <button onClick={() => rando(200, 20)}>Fuzz!</button>
      <button onClick={() => rando(200, 20, 1000)}>Fuzzsec!</button>
      <button onClick={() => this.clear()}>Clear</button>
      <button onClick={() => this.kill()}>kill</button>
      <br/>
      */}
      State!
      <ul style={styles.list}>
        {ids.map(id => <li>
          <label style={{...styles.item, backgroundColor: items[id].color}}>
            <input
              type="checkbox"
              onClick={() => this.setCompleted(id, !items[id].completed)}
              checked={items[id].completed}
            />
            <span style={styles.text}>{items[id].text}</span>
            <button style={styles.remove} onClick={() => this.remove(id)}>&times;</button>
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
    width: '200px',
  },
  remove: {
    cursor: 'pointer',
  },

  item: {
    padding: '5px 10px',
    display: 'inline-block',
    cursor: 'pointer',
  },
};

window.ttab = tab;
// require('./fuzz')(tab);

tab.init().then(() => {

  console.log('pre');
  React.render(<App/>, document.body);
  console.log('post');
}).catch(err => console.log('Error from render', err, err.stack));
