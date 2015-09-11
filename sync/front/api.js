
export default class APITalker {
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

  poll(head) {
    fetch(this.base + head + '/poll').then(res => res.json());
  }

  dump() {
    fetch(this.base + '/dump').then(res => res.json());
  }

  update(head, pending) {
    fetch(this.base + head + '/update', {
      method: 'POST',
      body: JSON.stringify(pending),
      headers: {
        'content-type': 'application/json',
      },
    }).then(res => res.json());
  }
}

