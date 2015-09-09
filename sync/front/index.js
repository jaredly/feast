
class SyncFront {
  constructor(port) {
    port.addEventListener('message', e => {
    });
    port.start();
    this.port = port;
  }


}

