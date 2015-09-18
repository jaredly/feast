
import DisconnectedMemRemote from '../DisconnectedMemRemote';
import LaggyMemRemote from '../LaggyMemRemote';
import MemRemote from '../MemRemote';
import Shared from '../Shared';
import Tab from '../Tab';

import {pit, pwait, pcheck, prom, fakeDb, socketPair, laggySocketPair, randomSocketPair, checkUntil} from './helpers';
import {expect} from 'chai';
import chalk from 'chalk';

function rand(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function rebaser(actions, oldTail, newTail) {
  return actions.map(({id, action: {name}}) => ({id, action: {name: name + '+'}}));
}

function reducer(state, {action}) {
  if (!state) state = {names: []};
  return {names: state.names.concat([action.name])};
}


describe('testing network interop', () => {
  pit('simple setup, starting disconnected', async () => {
    var remote = new DisconnectedMemRemote(reducer, [{id: 'first', action: {name: 'thefirst'}}]);
    remote.connected = false;
    var db = fakeDb(reducer, null, null, [{
      id: 'second',
      action: {name: 'thesecond'},
    }]);
    var shared = new Shared(db, remote, rebaser, 1);

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    await shared.init();
    await tab.init();

    tab.addAction({name: 'tabbed'});
    await pwait(20);
    remote.connected = true;
    await pwait(20);

    expect(tab.state.serverHead).to.equal(remote.head);
    expect(shared.state.serverHead).to.equal(remote.head);

    var goalData = remote.actions.reduce(reducer, null);
    expect((await db.dumpData()).data).to.eql(goalData, 'db dump');
    expect(tab.state.local).to.eql(goalData, 'db dump');
    expect(tab.state.shared).to.eql(goalData, 'db dump');
    expect(tab.state.server).to.eql(goalData, 'db dump');
  });

  pit('simple setup, disconnected in the middle', async () => {
    var remote = new DisconnectedMemRemote(reducer, [{id: 'first', action: {name: 'thefirst'}}]);
    var db = fakeDb(reducer, null, null, [{
      id: 'second',
      action: {name: 'thesecond'},
    }]);
    var shared = new Shared(db, remote, rebaser, 1);

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    await shared.init();
    await tab.init();

    tab.addAction({name: 'tabbed'});
    await pwait(20);
    remote.connected = false;
    tab.addAction({name: 'more'});
    await pwait(5);
    tab.addAction({name: 'then'});
    await pwait(5);
    remote.connected = true;
    await pwait(20);

    expect(tab.state.serverHead).to.equal(remote.head);
    expect(shared.state.serverHead).to.equal(remote.head);

    var goalData = remote.actions.reduce(reducer, null);
    expect((await db.dumpData()).data).to.eql(goalData, 'db dump');
    expect(tab.state.local).to.eql(goalData, 'db dump');
    expect(tab.state.shared).to.eql(goalData, 'db dump');
    expect(tab.state.server).to.eql(goalData, 'db dump');
  });
});

