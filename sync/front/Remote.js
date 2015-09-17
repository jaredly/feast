
import debug from 'debug';
const info = debug('sync:remote:info');
const warn = debug('sync:remote:warn');
const error = debug('sync:remote:error');

export default class Remote {
  constructor() {
    this.head = null;
  }

  async getActionsBetween(first, second) {
    throw new Error();
  }

  async addActions(actions) {
    throw new Error();
  }

  async sync({actions, serverHead}) {
    if (this.head !== serverHead) {
      return {actions: await this.getActionsBetween(serverHead, this.head), oldServerHead: serverHead, newServerHead: this.head};
    }

    this.head = actions[actions.length - 1].id;
    this.addActions(actions).catch(err => {
      error('failed to add actions', actions, err);
    }); // no need to wait
    return {
      actions: null,
      oldServerHead: serverHead,
      newServerHead: this.head,
    };
  }
}


