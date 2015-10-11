importScripts('./Dexie.js');

var db = new Dexie('todo-stampy');

db.version(1).stores({
  items: 'id, completed, owner',

  // bookkeeping
  pending: '++idx, id',
  meta: 'id',
});

db.version(2).stores({
  items: 'id, completed, owner',

  // bookkeeping
  pending: 'id',
  meta: 'id',
});

db.version(3).stores({
  items: 'id, completed, owner',
  audit: '++num',

  // bookkeeping
  pending: 'id',
  meta: 'id',
});

db.open().catch(
  err => console.error('failed to open db', err)
);

export default db;
