require('babel-core/polyfill');

import '../util/enable-debug';

import setupClient from '../../../sync/front/setup-client';
import rebaser from '../util/rebaser';
import reducer from '../util/reducer';
import React from 'react';
import App from './';

setupClient({rebaser, reducer, sharedPath: './build/shared.js'}).then(tab => {
  window.ttab = tab;
  require('./fuzz')(tab);
  React.render(<App tab={tab} />, document.body);
}).catch(err => console.error('Error from render', err, err.stack));

