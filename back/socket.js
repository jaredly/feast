
import {Server} from 'ws';
import PollingBack from '../../sync/back/polling';

var polling = new PollingBack(db);

var wss = new Server(9019);
wss.on('connection', ws => {
  ws.once('message', message => {
    db.getActionsSince(message.head).then(({actions, head}) => {
      ws.send({type: 'update', actions, head, oldHead: message.head});
    }).then(
      () => polling.addConnection(ws),
      err => console.error('failed to init', err, message)
    );
  });
});

