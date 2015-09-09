
import BaseDB from './basedb';

class MemDB extends BaseDB {
  constructor() {
    super();
    this.actions = [];
  }

  getAllActions() {
    return {actions: this.actions, head: this.lastId};
  }

  getActionsSince(id) {
    if (id === this.lastId) {
      return [];
    }
    return this.actions.slice(id);
  }

  addActions(actions) {
    this.actions = this.actions.concat(actions);
    return this.actions.length;
  }
}

