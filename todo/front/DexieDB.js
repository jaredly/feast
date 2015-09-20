
export default class DexieDB {
  constructor(db) {
    this.db = db;
  }

  dumpData() {
    return this.db.transaction('r', [this.db.items, this.db.meta], () => {
      return Promise.all([
        this.db.items.toArray(),
        this.db.meta.get('sync'),
      ]);
    }).then(([items, sync]) => {
      var data = {};
      items.forEach(item => data[item.id] = item);
      return {data, serverHead: sync ? sync.head : false};
    });
  }

  dump() {
    return this.db.transaction('r', [this.db.items, this.db.pending, this.db.meta], () => {
      return Promise.all([
        this.db.items.toArray(),
        this.db.pending.orderBy('idx').toArray(),
        this.db.meta.get('sync'),
      ]);
    }).then(([items, pending, sync]) => {
      var data = {};
      items.forEach(item => data[item.id] = item);
      return {data, pending, serverHead: sync ? sync.head : false};
    });
  }

  setDump({data, serverHead, pending}) {
    return this.db.transaction('rw', [this.db.items, this.db.pending, this.db.meta], () => {
      var adds = Object.keys(data.items).map(id => this.db.items.put(data.items[id], id));
      var pendings = pending.map(pend => this.db.pending.add(pend));
      var sync = this.db.meta.put({head: serverHead, date: new Date()}, 'sync');
      return Promise.all(adds.concat(pendings).concat([sync]));
    });
  }

  addPending(pending) {
    return this.db.transaction('rw', this.db.pending, () => {
      pending.forEach(pend => this.db.pending.add(pend));
    });
  }

  commitPending(pending, newServerHead) {
    return this.db.transaction('rw', [this.db.items, this.db.pending, this.db.meta], () => {
      this.removePending(pending);
      this.addActions(pending, newServerHead);
    });
  }

  removePending(pending) {
    return this.db.transaction('rw', this.db.pending, () => {
      return this.db.pending.where('id').anyOf(pending.map(p => p.id)).delete();
    });
  }

  addActions(pending, newServerHead) {
    return this.db.transaction('rw', this.db.items, this.db.meta, () => {
      this.db.meta.put({head: newServerHead, date: new Date()}, 'sync');
      return pending.map(({id, action}) => applyAction(action, this.db.items));
    });
  }

  // after a rebase, need to remove the old pending, and replace with the
  // rebased pending.
  replacePending(oldPending, newPending, newServerHead) {
    serverHead = newServerHead;
  }
}

function applyAction(action, items) {
  if (!state) state = {items: {}};
  switch (action.type) {
    case 'add':
      return items.add(action.item, action.id);
    case 'edit':
      return items.update(action.id, action.update);
    case 'remove':
      return items.delete(action.id);
  }
}
