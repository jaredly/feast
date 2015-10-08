
export default (url, remote) => {
  const listeners = [];
  const disconnectListeners = [];
  const clientId = Math.random().toString(16).slice(2);
  debugger;
  const handle = e => {
    if (busy) return;
    const data = JSON.parse(e.data);
    listeners.map(fn => fn(data));
  };
  const closed = e => {
    try {
      connect();
    } catch (e) {
      setTimeout(() => closed(), 500);
      disconnectListeners.forEach(f => f());
    }
  };

  let ws = null;
  const connect = () => {
    ws = new WebSocket(url + '?clientId=' + clientId);
    ws.addEventListener('message', handle);
    ws.addEventListener('close', closed);
  }

  connect();

  let busy = false;
  return {
    dump: () => {
      busy = true;
      return remote.dump().then(
        val => (busy = false, val),
        err => {busy = false; throw err}
      );
    },
    sync: ({actions, serverHead}) => {
      busy = true;
      return remote.sync({actions, serverHead, clientId}).then(
        val => (busy = false, val),
        err => {busy = false; throw err}
      );
    },
    onExtra: fn => {
      listeners.push(fn);
    },
    onDisconnect: fn => {
      disconnectListeners.push(fn);
    }
  }
}

