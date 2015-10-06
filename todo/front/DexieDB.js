// UNUSED

export default class DexieDB {
  constructor(db) {
    this.db = db;
    this.order =  [];
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
    return this.db.transaction('r', [
      this.db.items, this.db.pending, this.db.meta
    ], () => Promise.all([
        this.db.items.toArray(),
        this.db.meta.get('sync'),
        this.db.meta.get('pendingOrder'),
      ])
    ).then(async ([items, sync, pendingOrder]) => {
      var data = {};
      var order = pendingOrder ? pendingOrder.ids : [];
      items.forEach(item => data[item.id] = item);
      var pending = [];
      this.order = order;
      if (order.length) {
        pending = await this.db.pending.where(':id').oneOf(order).toArray();
        pending.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      }
      return {data, pending, serverHead: sync ? sync.head : false};
    });
  }

  setDump({data, serverHead, pending}) {
    return this.db.transaction('rw', [this.db.items, this.db.pending, this.db.meta], () => {
      var clear = this.db.pending.clear();
      var adds = data ? Object.keys(data.items).map(id => this.db.items.put(data.items[id])) : [];
      var pendings = pending.map(pend => this.db.pending.put(pend));
      var order = pending.map(p => p.id);
      this.order = order;
      var orderProm = this.db.meta.put({id: 'pendingOrder', ids: order});
      var sync = this.db.meta.put({id: 'sync', head: serverHead, date: new Date()});
      return Promise.all([clear, sync, orderProp].concat(adds, pendings));
    });
  }

  addPending(pending) {
    return this.db.transaction('rw', this.db.pending, this.db.meta, () => {
      pending.forEach(pend => this.db.pending.add(pend));
      this.order = this.order.concat(pending.map(p => p.id));
      this.db.meta.put({id: 'pendingOrder', ids: this.order});
    });
  }

  commitPending(pending, newServerHead) {
    return this.db.transaction('rw', this.db.items, this.db.pending, this.db.meta, () => {
      return Promise.all([
        this.removePending(pending),
        this.addActions(pending, newServerHead)
      ]).catch(err => {
        console.error('Error committing pending!', err, err.stack);
        throw err;
      });
    }).catch(err => {
      console.error('Error pending commit transaction!', err, err.stack);
      throw err;
    });
  }

  removePending(pending) {
    return this.db.transaction('rw', this.db.pending, this.db.meta, () => {
      pending.forEach((p, i) => {
        if (p.id !== this.order[i]) {
          console.error('remove pending mismatch!', pending, this.order);
        }
      });
      this.order = this.order.slice(pending.length);
      return Promise.all([
        this.db.pending.where('id').anyOf(pending.map(p => p.id)).delete(),
        this.db.meta.put({id: 'pendingOrder', ids: this.order}),
      ]);
    }).catch(err => console.error('failed to remove pending', err, err.stack));
  }

  addActions(pending, newServerHead) {
    return this.db.transaction('rw', this.db.items, this.db.meta, () => {
      pending.map(({id, action}) => {
        try {
          applyAction(action, this.db.items).catch(err => {
            console.error('err applying action', id, action, err, err.stack);
          })
        } catch (e) {
          console.error('Apply action *fail*', e, id, action, e.stack);
        }
      });
      this.db.meta.put({id: 'sync', head: newServerHead, date: new Date()})
    }).catch(err => console.error('failed to add actions', err, err.stack));
  }

  // after a rebase, need to remove the old pending, and replace with the
  // rebased pending.
  replacePending(oldPending, newPending) {
    return this.db.transaction('rw', this.db.pending, () => {
      this.order = newPending.map(p => p.id).concat(this.order.slice(oldPending.length));
      return Promise.all([
        this.db.pending.where(':id').oneOf(oldPending.map(p => p.id)).delete(),
        this.db.meta.put({id: 'pendingOrder', ids: this.order}),
      ].concat(newPending.map(pend => this.db.pending.put(pend))));
    });
  }
}

function applyAction(action, items) {
  switch (action.type) {
    case 'add':
      return items.add(action.item);
    case 'edit':
      return items.update(action.id, action.update);
    case 'remove':
      return items.delete(action.id);
  }
}
