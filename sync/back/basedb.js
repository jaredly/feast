
export default class BaseDB {
  constructor(reduce) {
    this.lastId = 0;
    this.reduce = reduce;
  }

  init() {
    return Promise.resolve();
  }

  getLatestActionID() {
    return this.lastId;
  }

  getAllActions() {
    throw new Error();
  }

  getActionsSince(id) {
    throw new Error();
  }

  addActions(actions) {
    throw new Error();
  }

  async tryAddActions(actions, head) {
    const latest = this.getLatestActionID();
    if (head !== latest) {
      const {actions, head: newHead} = await this.getActionsSince(head);
      return {rebase: actions, head: newHead};
    }
    return {head: await this.addActions(actions)};
  }

  dump() {
    return this.getActionsSince(0).then(({actions, head}) => {
      const data = actions.reduce(this.reduce, null);
      return {data, head};
    });
  }
}

