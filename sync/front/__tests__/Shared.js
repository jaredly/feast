
import ShallowShared from '../ShallowShared';
import Shared from '../Shared';
import Tab from '../Tab';

import {pit, pwait, pcheck, prom, fakeDb, socketPair, laggySocketPair, randomSocketPair, checkUntil} from './helpers';
import {expect} from 'chai';


function rebaser(actions, oldTail, newTail) {
  return actions.map(({id, action: {name}}) => ({id, action: {name: name + '+'}}));
}

function reducer(state, {action}) {
  if (!state) state = {names: []};
  return {names: state.names.concat([action.name])};
}


describe('Shared.js', () => {
  it('should initialize a tab', pit(async () => {
    var [ls1, ls2] = socketPair();
    var db = fakeDb(reducer, {names: ['woah']}, 1, [{id: 'theid', action: {name: 'awesome'}}]);
    var shared = new Shared(db, ls2);

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    await Promise.all([shared.init(), tab.init()]);
    expect(tab.state.local).to.eql({names: ['woah', 'awesome']});
  }));

  it('should initialize after added', pit(async () => {
    var [ls1, ls2] = socketPair();
    var db = fakeDb(reducer, {names: ['woah']}, 1, [{id: 'theid', action: {name: 'awesome'}}]);
    var shared = new Shared(db, ls2);

    await shared.init();

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    await tab.init();

    expect(tab.state.local).to.eql({names: ['woah', 'awesome']});
  }));
});
