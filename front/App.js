
import React from 'react';
import {RouteHandler} from 'react-router';

import Nav from './Nav';

export default class App {
  render() {
    return (
      <div style={styles.container}>
        <Nav />
        <RouteHandler />
      </div>
    );
  }
};

var styles = {
};

