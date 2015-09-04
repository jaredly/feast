
import React from 'react';
import db from './db';

export default class Importer {
  constructor() {
    super();
    this.state = {username: '', password: ''};
  }
  submit() {

  }
  render() {
    return (
      <div style={styles.container}>
        <input
          type="text"
          value={this.state.username}
          placeholder="Username"
          onChange={e => this.setState({username: e.target.value})}
        />
        <input
          type="password"
          value={this.state.password}
          placeholder="Password"
          onChange={e => this.setState({password: e.target.value})}
        />
        <button onClick={this.submit.bind(this)}>Import</button>
      </div>
    );
  }
}

var styles = {
};

