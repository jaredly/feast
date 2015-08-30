
import React from 'react';
import db from './db';

import Nav from './Nav';
import StudiesEditor from './StudiesEditor';

export default class Editor extends React.Component {
  render() {
    return (
      <div style={styles.container}>
        <Nav />

        <StudiesEditor />
      </div>
    );
  }
}

var styles = {
};

