
import {pit, pwait, pcheck, prom, socketPair, laggySocketPair, randomSocketPair, checkUntil} from './helpers';

import {expect} from 'chai';

function rebaser(actions, oldTail, newTail) {
  return actions.map(({id, action: {name}}) => ({id, action: {name: name + '+'}}));
}

function reducer(state, {action}) {
  if (!state) state = {names: []};
  return {names: state.names.concat([action.name])};
}


export default (name, makeDb) => {
  const makeLocal = async (reducer, data, serverHead, pending) => {
    const db = makeDb(reducer);
    if (data || serverHead || pending) {
      await db.setDump({data, serverHead, pending})
    }
    return db;
  };

  describe('Database Tests - ' + name, () => {
    pit('should init', async () => {
      const db = await makeDb(reducer);
      await db.delete();
    });

    pit('shound load & dump', async () => {
      const init = {
        data: {names: ['awesome']},
        serverHead: 1,
        pending: [{id: 'pend', action: {name: 'next'}}],
      };
      const db = await makeDb(reducer, init.data, init.serverHead, init.pending);
      const {data, pending, serverHead} = await db.dump();
      expect(data).to.eql(init.data);
      expect(pending).to.eql(init.pending);
      expect(serverHead).to.eql(init.serverHead);
      await db.delete();
    });

    pit('should load & dump (to tab)', async () => {
      const init = {
        data: {names: ['awesome']},
        serverHead: 1,
        pending: [{id: 'pend', action: {name: 'next'}}],
      };
      const db = await makeDb(reducer, init.data, init.serverHead, init.pending);
      const {data, serverHead} = await db.dumpData();
      expect(data).to.eql(init.data);
      expect(serverHead).to.eql(init.serverHead);
      await db.delete();
    });

    pit('should set, get, and commit pending', async () => {
      const db = await makeDb(reducer, {names: []}, 1, []);
      const pending = [
        {id: 'a', action: {name: 'a1'}},
        {id: 'b', action: {name: 'b1'}},
      ];
      await db.addPending(pending);
      expect((await db.dump()).pending).to.eql(pending);
      await db.commitPending(pending, 'b');
      const updated = await db.dump();
      expect(updated.data).to.eql({names: ['a1', 'b1']});
      expect(updated.pending).to.eql([]);
      expect(updated.serverHead).to.eql('b');
      await db.delete();
    });

    pit('should replace pending', async () => {
    });
  });

}

