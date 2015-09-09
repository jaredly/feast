
import Socketeer from './Socketeer';

export default class WSTalker {
  constructor(ws) {
    this.sock = new Socketeer(ws);
  }

  dump() {
    return this.sock.send('dump');
  }

  poll(head) {
    return this.sock.send('poll', {head});
  }

  update(head, pending) {
    return this.sock.send('update', {head, pending});
  }
}
