
export default class RemoteHTTP {
  constructor(apiBase) {
    this.base = apiBase;
  }

  init(head, pending) {
    if (pending.length) {
      return this.update(head, pending);
    } else {
      return this.poll(head);
    }
  }

  getActionsSince(head) {
    fetch(this.base + head + '/poll').then(res => res.json());
  }

  dump() {
    fetch(this.base + '/dump').then(res => res.json());
  }

  tryAddActions(pending, head) {
    fetch(this.base + head + '/update', {
      method: 'POST',
      body: JSON.stringify(pending),
      headers: {
        'content-type': 'application/json',
      },
    }).then(res => res.json());
  }
}

