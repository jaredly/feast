
export default function importLDS(username, password) {
  var ws = connect(message => {
    console.log('got a message!');
  });

  ws.send(JSON.stringify({username, password}));
};

function connect(fn) {
  var ws = new WebSocket('ws://localhost:7331')

  ws.onmessage = evt => {
    var data = JSON.parse(evt.data);
    fn(data);
  };

  ws.onerror = err => {
    console.log('failed websocket', err);
  };

  ws.onclose = () => console.error('ws closed');

  return ws;
}

