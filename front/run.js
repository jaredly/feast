
import {Map} from 'immutable';
import React from 'react';
import Remarkable from './Rem2';
import ReduxRem from './ReduxRem';
import Wrapper from './Wrap';

import { createStore } from 'redux';
import { Provider } from 'react-redux';

import reducers from './reducers';

import makeVerses from './make-verses';

import getScriptures from './get-scriptures';
window.getScriptures = getScriptures;

import Browser from './Browser';

/*
var size = {
  width: 1000,
  vmargin: 50,
  hmargin: 300,
};
var fontSize = 25;
var font = {
  family: 'serif',
  space: fontSize / 3,
  lineHeight: fontSize * 1.4,
  size: fontSize,
  indent: fontSize,
};

var verses = makeVerses();
var store = createStore(reducers(verses, font, size));

React.render(<Provider store={store}>
  {() => <ReduxRem size={size} font={font} />}
</Provider>, node);
*/

var node = document.createElement('div');
document.body.appendChild(node)

React.render(<Browser />, node);

