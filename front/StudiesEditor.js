
import React from 'react';

function gen() {
  return Math.random().toString(16).slice(2);
}

export default class StudiesEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      newName: '',
      studies: [],
    };
  }

  componentWillMount() {
    this.refresh();
  }

  onKeyDown(e) {
    if (e.key === 'Enter') {
      this.createStudy();
    }
  }

  createStudy() {
    db.studies.put({id: gen(), title: this.state.newName})
      .then(() => this.setState({newName: ''}))
      .then(() => this.refresh());
  }

  refresh() {
    db.studies.toArray(studies => this.setState({studies}));
  }

  render() {
    return (
      <div style={styles.container}>
        <input
          type='text'
          value={this.state.newName}
          onChange={e => this.setState({newName: e.target.value})}
          placeholder="New Study Name"
          onKeyDown={this.onKeyDown.bind(this)}
        />
        <ul>
          <li>General</li>
          {this.state.studies.map(item => <li key={item.id}>{item.title}</li>)}
        </ul>
      </div>
    );
  }
}

var styles = {
};
