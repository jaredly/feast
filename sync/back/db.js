
import BaseDB from './basedb';

export default class MemDB extends BaseDB {
  constructor(reduce) {
    super(reduce);
    this.actions = [];
  }

  getAllActions() {
    return Promise.resolve({actions: this.actions, head: this.lastId});
  }

  getActionsSince(id) {
    if (id === this.lastId) {
      return Promise.resolve({actions: [], head: this.lastId});
    }
    return Promise.resolve({actions: this.actions.slice(id), head: this.lastId});
  }

  addActions(actions) {
    this.actions = this.actions.concat(actions);
    this.lastId = this.actions.length;
    return Promise.resolve(this.actions.length);
  }
}

