
import chalk from 'chalk';
import {expect} from 'chai';
import {EventEmitter} from 'events';
import {List, fromJS} from 'immutable';

import Socketback from '../Socketback';
import Socketeer from '../Socketeer';
import prom from '../prom';

import SharedManager from '../SharedManager';
import TabComm from '../TabComm';
import MemDB from '../MemDB';
import RemoteMemDB from '../../back/db';

import {tick, rtick, tickp, makePorts, make, makeTracking, basicDb, basicConn} from './utils';

chalk.enabled = true;

function immReduce(state, action) {
  if (!state) state = fromJS({num: 0, actions: []});
  var num = state.get('num');
  if (action.type === 'add') {
    num += action.num;
  } else if (action.type === 'mul') {
    num *= action.num;
  }
  return state.set('num', num).updateIn(['actions'], a => a.concat([action]));
}

function mutReduce(state, action) {
  if (!state) state = {num: 0, actions: []};
  if (action.type === 'add') {
    state.num += action.num;
  } else if (action.type === 'mul') {
    state.num *= action.num;
  }
  state.actions.push(action);
  return state;
}

describe('Multiple SharedManagers', () => {
  it.only('should work', done => {

    var db = new MemDB(mutReduce);

    var remoteDB = new RemoteMemDB(mutReduce);
    var shared = new SharedManager(db, remoteDB);

    var [clientPort, sharedPort] = makePorts('one');
    var client = new TabComm(clientPort, immReduce);
    shared.addConnection(sharedPort);

    shared.init().then(() => client.init()).then(() => {
      client.addAction({type: 'add', num: 10});
      client.addAction({type: 'mul', num: 5});
      client.addAction({type: 'add', num: 2});
    }).then(() => setTimeout(() => {
      expect(db.state.num).to.equal(52, 'local db');
      expect(client.state.get('num')).to.equal(52, 'client state');
      remoteDB.dump().then(({data, head}) => {
        expect(data.num).to.equal(52, 'remote db')
        done();
      }).catch(done);
    }, 150)).catch(done);
  });
});

