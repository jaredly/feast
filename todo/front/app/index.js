
import * as creators from '../util/creators';
import React from 'react';

const uuid = () => Math.random().toString(16).slice(2);

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {items: (props.tab.state.local || {}).items, newText: ''};
    var oldSet = props.tab.setState;
    props.tab.setState = (state, type) => {
      this.setState({items: state.local.items});
      oldSet.call(props.tab, state, type);
    };
  }

  setCompleted(id, completed) {
    this.props.tab.addAction(creators.update(id, {completed}));
  }

  add() {
    if (!this.state.newText.length) return;
    const {newText} = this.state;
    this.setState({newText: ''});
    const id = uuid();
    this.props.tab.addAction(creators.add(id, newText));
  }

  clear() {
    Object.keys(this.props.tab.state.local.items).map(id => this.remove(id));
  }

  async kill() {
    await new Dexie('todo-stampy').delete();
    location.reload();
  }

  remove(id) {
    this.props.tab.addAction(creators.remove(id));
  }

  render() {
    const {items} = this.state;
    const ids = items ? Object.keys(items) : [];
    ids.sort();
    const idSum = ids.reduce((s, id) => s + parseInt(id, 16), 0).toString(16);
    return <div>
      <button onClick={() => rando(200, 20)}>Fuzz!</button>
      <button onClick={() => rando(200, 20, 1000)}>Fuzzsec!</button>
      <button onClick={() => this.clear()}>Clear</button>
      <button onClick={() => this.kill()}>kill</button>
      <br/>
      State! {ids.length} items : sum {idSum}
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

