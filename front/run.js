
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

import App from './App';
import Browser from './Browser';
import Editor from './Editor';
// import Importer from './Importer';

import Router, {Route, DefaultRoute} from 'react-router';

var routes = (
  <Route handler={App} path="/">
    <DefaultRoute handler={Browser} />
    <Route name="view" path="/view/*" handler={Browser} />
    <Route name="edit" handler={Editor} />
  </Route>
);
    // <Route name="import" handler={Importer} />

var node = document.createElement('div');
document.body.appendChild(node)
Router.run(routes, function (Handler) {
  React.render(<Handler/>, node);
});
