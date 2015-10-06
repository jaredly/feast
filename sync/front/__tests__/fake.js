
import DBtests from './DB-tests';
import fakeDb from './fakeDb';
import DexieAdapter from '../DexieDB';

// Test thing

function applyAction(db, action) {
  return db.names.put({name: action.name});
}

function dump(db) {
  return db.names.toArray().then(items => ({
    names: items.map(item => item.name)
  }));
}

function setData(db, data) {
  return db.names.clear().then(() => Promise.all(data.names.map(name => db.names.put({name}))))
}

async function makeDexie(_, data, serverHead, pending) {
  const name = 'db-test-' + Math.random().toString(16).slice(2)
  console.log('new db', name);
  const db = new Dexie(name);
  db.version(1).stores({
    names: 'name',
    pending: '++idx, id',
    meta: 'id',
  });
  await db.open();
  const local = new DexieAdapter(db, [db.names], applyAction, dump, setData)
  if (data || serverHead || pending) {
    await local.setDump({data, serverHead, pending});
  }
  return local;
}

DBtests('fake', fakeDb);
// DBtests('dexie', makeDexie);

