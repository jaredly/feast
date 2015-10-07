
export default (url, remote) => {
  const listeners = [];
  const clientId = Math.random().toString(16).slice(2);
  debugger;
  const ws = new WebSocket(url + '?clientId=' + clientId);
  ws.addEventListener('message', e => {
    if (busy) return;
    const data = JSON.parse(e.data);
    listeners.map(fn => fn(data));
  });

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
    }
  }
}

