
import ws from 'ws';
import url from 'url';

export default (server, remote) => {
  const clients = {};
  const wss = new ws.Server({server});
  wss.on('connection', sock => {
    const location = url.parse(sock.upgradeReq.url, true);
    clients[location.query.clientId] = sock;
    sock.on('close', () => {
      delete clients[location.query.clientId];
    });
  });
  const oldSync = remote.sync.bind(remote);
  remote.sync = ({clientId, ...kwds}) =>
    oldSync(kwds).then(val => {
      if (val.rebase || !kwds.actions.length) return val;
      const send = JSON.stringify({
        ...val,
        actions: kwds.actions,
      });
      Object.keys(clients).forEach(id => {
        if (id !== clientId) {
          try {
            clients[id].send(send);
          } catch (e) {
            console.error('failed to send', val, 'to', id, e, e.stack);
          }
        }
      });
      return val;
    });
}

