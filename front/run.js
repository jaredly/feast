
import {Map} from 'immutable';
import React from 'react';
import Remarkable from './Rem2';
import ReduxRem from './ReduxRem';
import Wrapper from './Wrap';

import { createStore } from 'redux';
import { Provider } from 'react-redux';

import reducers from './reducers';

import getScriptures from './get-scriptures';
import makeVerses from './make-verses';

window.getScriptures = getScriptures;

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

var node = document.createElement('div');
document.body.appendChild(node)

var verses = makeVerses();
var store = createStore(reducers(verses, font, size));

React.render(<Provider store={store}>
  {() => <ReduxRem size={size} font={font} />}
</Provider>, node);
