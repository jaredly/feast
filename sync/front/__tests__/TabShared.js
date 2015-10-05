
import ShallowShared from '../ShallowShared';
import Shared from '../Shared';
import Tab from '../Tab';

import {pit, pwait, pcheck, prom, socketPair, laggySocketPair, randomSocketPair, checkUntil} from './helpers';
import {expect} from 'chai';

function rebaser(actions, oldTail, newTail) {
  return actions.map(({id, action: {name}}) => ({id, action: {name: name + '+'}}));
}

function reducer(state, {action}) {
  if (!state) state = {names: []};
  return {names: state.names.concat([action.name])};
}

describe('TabShared stuff', () => {
  it('tab add action should sync w/ shared', () => {
    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    var shared = new ShallowShared(rebaser);
    shared.addConnection(sharedSock);

    tab.addAction({name: 'hello'});

    expect(tab.state.shared).to.eql({names: ['hello']});
    expect(tab.state.local).to.eql({names: ['hello']});
  });

  it('should sync between two tabs', () => {
    var shared = new ShallowShared(rebaser);

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    var [tabSock2, sharedSock2] = socketPair();
    var tab2 = new Tab(tabSock2, reducer, rebaser);
    shared.addConnection(sharedSock2);

    tab.addAction({name: 'hello'});

    expect(tab.state.shared).to.eql({names: ['hello']});
    expect(tab.state.local).to.eql({names: ['hello']});
    expect(tab2.state.shared).to.eql({names: ['hello']});
    expect(tab2.state.local).to.eql({names: ['hello']});
  });

  pit('should reconcile contending actions from two tabs', async () => {
    var shared = new ShallowShared(rebaser);

    var [tabSock, sharedSock] = laggySocketPair(2);
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    var [tabSock2, sharedSock2] = laggySocketPair(10);
    var tab2 = new Tab(tabSock2, reducer, rebaser);
    shared.addConnection(sharedSock2);

    await Promise.all([tab.init(), tab2.init()]);

    tab2.addAction({name: 'world'});
    tab.addAction({name: 'hello'});

    var goal = {names: ['hello', 'world+']};
    await pwait(100);
    expect(tab.state.shared).to.eql(goal, 'tab state');
    expect(tab.state.local).to.eql(goal, 'tab local');
    expect(tab2.state.shared).to.eql(goal, 'tab2 shared');
    expect(tab2.state.local).to.eql(goal, 'tab2 local');
  });

  pit('should reconcile contending actions from lots of tabs', async () => {
    var shared = new ShallowShared(rebaser);

    var tabs = [];
    for (var i=0; i<10; i++) {
      var [tabSock, sharedSock] = laggySocketPair(Math.floor(Math.random() * 4));
      var tab = new Tab(tabSock, reducer, rebaser);
      shared.addConnection(sharedSock);
      tabs.push(tab);
    }

    await Promise.all(tabs.map(t => t.init()));

    tabs.forEach((tab, i) => tab.addAction({name: 'first ' + i}));
    tabs.forEach((tab, i) => tab.addAction({name: 'second ' + i}));

    await pcheck(() => {
      var goal = shared.state.pending.reduce(reducer, null);
      return goal.names.length === tabs.length * 2;
    }, 50, 1000);

    var goal = shared.state.pending.reduce(reducer, null);
    // console.log('shared', goal);
    expect(goal.names.length).to.eql(tabs.length * 2);

    tabs.forEach((tab, i) => {
      expect(tab.state.shared).to.eql(goal, i + 'tab state');
      expect(tab.state.local).to.eql(goal, i + 'tab local');
    });
  });

  pit('should reconcile contending actions from a few tabs, lots of actions', async () => {
    var shared = new ShallowShared(rebaser);

    var tabs = [];
    for (var i=0; i<3; i++) {
      var [tabSock, sharedSock] = randomSocketPair(5, 10);
      var tab = new Tab(tabSock, reducer, rebaser);
      shared.addConnection(sharedSock);
      tabs.push(tab);
    }

    await Promise.all(tabs.map(t => t.init()));

    for (var i=0; i<10; i++) {
      tabs.forEach((tab, t) => tab.addAction({name: 'round ' + i + ' tab ' + t}));
    }

    await pcheck(() => {
      var goal = shared.state.pending.reduce(reducer, null);
      return goal.names.length === tabs.length * 10;
    }, 50, 1000);

    var goal = shared.state.pending.reduce(reducer, null);
    // console.log('shared', goal);
    expect(goal.names.length).to.eql(tabs.length * 10);

    tabs.forEach((tab, i) => {
      expect(tab.state.shared).to.eql(goal, i + 'tab state');
      expect(tab.state.local).to.eql(goal, i + 'tab local');
    });
  });
});

