
export default class JSocket {
  constructor(ws) {
    this.ws = ws;
  }

  send(val) {
    this.ws.send(JSON.stringify(val));
  }

  once(fn) {
    this.ws.once('message', evt => {
      fn(JSON.parse(evt.data));
    });
  }

  listen(fn) {
    this.ws.on('message', evt => {
      fn(JSON.parse(evt.data));
    });
  }
}

