/*

events:
- order: num
- order: num

meta: sync
committed: num <- the num up to which to get. The rest are pending.

--- on the other hand, if we are storing the view...

data: ????

pending:
- order: num
- order: num

meta: sync

*/

export default class DexieAdapter {
  constructor(db, {tables, applyAction, dump, setData}) {
    this._db = db;
    this._applyAction = applyAction
    this._dump = dump;
    this._setData = setData;
    this._tables = tables(db).concat([db.pending, db.meta]);;
  }

  setHead(head) {
    return this._db.meta.put({id: 'sync', head, date: new Date()});
  }

  dumpData() {
    return this._db.transaction('r', this._tables, () => {
      return Promise.all([
        this._dump(this._db),
        this._db.meta.get('sync'),
      ])
    }).then(([data, sync]) => {
      return {data, serverHead: sync ? sync.head : false};
    });
  }

  dump() {
    return this._db.transaction('r', this._tables, () => {
      return Promise.all([
        this._dump(this._db),
        this._db.meta.get('sync'),
        this._db.pending.toArray(),
      ]);
    }).then(([data, sync, pending]) => {
      return {data, pending, serverHead: sync ? sync.head : false};
    });
  }

  setDump({data, serverHead, pending}) {
    return this._db.transaction('rw', this._tables, () => {
      return Promise.all([
        this._setData(this._db, data),
        this.setHead(serverHead),
        this._db.pending.clear().then(() => pending.map(
          p => this._db.pending.put(p)
        )),
      ]);
    });
  }

  addPending(pending) {
    return this._db.transaction('rw', this._db.pending, () => {
      return Promise.all(
        pending.map(pend => this._db.pending.add(pend))
      );
    });
  }

  commitPending(pending, newServerHead) {
    return this._db.transaction('rw', this._tables, () => {
      return Promise.all([
        this.removePending(pending),
        this.addActions(pending, newServerHead),
      ]);
    });
  }

  removePending(pending) {
    return this._db.transaction('rw', [this._db.pending, this._db.meta], () => {
      return this._db.pending.where('id')
        .anyOf(pending.map(p => p.id)).delete();
    });
  }

  addActions(pending, newServerHead) {
    return this._db.transaction('rw', this._tables, () => {
      var actions = pending.reduce((p, {action, pid}) => {
        return p.then(() => this._applyAction(this._db, action, pid));
      }, Promise.resolve(true));
      return Promise.all([this.setHead(newServerHead), actions]);
    });
  }

  replacePending(oldPending, newPending) {
    return this._db.transaction('rw', this._db.pending, () => {
      // newPending.length >= oldPending
      newPending.slice(0, oldPending.length).forEach((pend, i) => {
        this._db.pending.update(oldPending[i].idx, pend);
      });
      newPending.slice(oldPending.length).forEach(pend => {
        this._db.pending.put(pend);
      });
    });
  }

  delete() {
    return this._db.delete();
  }
}

