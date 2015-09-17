
import debug from 'debug';
const info = debug('sync:remote:info');
const warn = debug('sync:remote:warn');
const error = debug('sync:remote:error');

export default class Remote {
  constructor(reducer) {
    this.head = null;
    this.reducer = reducer;
  }

  async dump() {
    const head = this.head;
    const actions = await this.getActionsBetween(null, head);
    return {
      data: actions.reduce(this.reducer, null),
      serverHead: head,
    };
  }

  async getActionsBetween(first, second) {
    throw new Error();
  }

  async addActions(actions) {
    throw new Error();
  }

  async sync({actions, serverHead}) {
    if (this.head !== serverHead) {
      var head = this.head;
      return {actions: await this.getActionsBetween(serverHead, head), oldServerHead: serverHead, newServerHead: head, rebase: true};
    }
    if (!actions.length) {
      return {actions: null, rebase: false, oldServerHead: this.head, newServerHead: this.head};
    }

    this.head = actions[actions.length - 1].id;
    this.addActions(actions).catch(err => {
      error('failed to add actions', actions, err);
    }); // no need to wait
    info('new server head', this.head);
    return {
      rebase: false,
      actions: null,
      oldServerHead: serverHead,
      newServerHead: this.head,
    };
  }
}


