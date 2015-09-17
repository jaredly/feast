
import MemRemote from '../MemRemote';
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
  pit('should initialize a tab', async () => {
    var remote = new MemRemote();
    var db = fakeDb(reducer, {names: ['woah']}, 1, [{id: 'theid', action: {name: 'awesome'}}]);
    var shared = new Shared(db, remote);

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    await Promise.all([shared.init(), tab.init()]);
    expect(tab.state.local).to.eql({names: ['woah', 'awesome']});
  });

  pit('should initialize after added', async () => {
    var remote = new MemRemote();
    var db = fakeDb(reducer, {names: ['woah']}, 1, [{id: 'theid', action: {name: 'awesome'}}]);
    var shared = new Shared(db, remote);

    await shared.init();

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    await tab.init();

    expect(tab.state.local).to.eql({names: ['woah', 'awesome']});
  });

  pit('should play well with tab adding action', async () => {
    var remote = new MemRemote();
    var db = fakeDb(reducer, {names: ['woah']}, 1, [{id: 'theid', action: {name: 'awesome'}}]);
    var shared = new Shared(db, remote);

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    await Promise.all([shared.init(), tab.init()]);
    tab.addAction({name: 'new'});
    tab.addAction({name: 'thing'});
    await pwait(100);
    var goal = {names: ['woah', 'awesome', 'new', 'thing']}
    expect(tab.state.local).to.eql(goal, 'tab local');
    expect(shared.state.pending.reduce(reducer, tab.state.server)).to.eql(goal, 'shared state');
  });

  pit('should sync to remote', async () => {
    var remote = new MemRemote([{id: 'first', action: {name: 'thefirst'}}]);
    var db = fakeDb(reducer, null);
    var shared = new Shared(db, remote, rebaser, 1);

    await shared.init();
    await pwait(2);

    expect(shared.state.serverHead).to.equal('first', 'shared serverHead');
    expect((await db.dumpData()).data).to.eql({names: ['thefirst']}, 'db dump');
  });

  pit('should sync a remote w/ pending', async () => {
    var remote = new MemRemote([{id: 'first', action: {name: 'thefirst'}}]);
    var db = fakeDb(reducer, null);
    var shared = new Shared(db, remote, rebaser, 1);

    await shared.init();
    await pwait(2);

    expect(shared.state.serverHead).to.equal('first');

    /*
    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    await Promise.all([shared.init(), tab.init()]);
    tab.addAction({name: 'new'});
    tab.addAction({name: 'thing'});
    await pwait(100);
    var goal = {names: ['woah', 'awesome', 'new', 'thing']}
    expect(tab.state.local).to.eql(goal, 'tab local');
    expect(shared.state.pending.reduce(reducer, tab.state.server)).to.eql(goal, 'shared state');
    */
  });
});
