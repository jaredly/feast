
import {Server} from 'ws';

var wss = new Server({port: 7331});

wss.on('connection', ws => {
  ws.on('message', raw => {
    var data = JSON.parse(raw);
    console.log('Received message', raw);
  });

  handleConnection(data => ws.send(JSON.stringify(data)));
});

import sqlite3 from 'sqlite3';

function handleConnection(send) {

  var db = new sqlite3.Database('./english');

  function getCount(fn) {
    // fn(10);
    db.get('select count(*) from node', (err, count) => fn(count['count(*)']));
  }

  getCount(count => {
    send({num: count});
    db.each('select * from node limit ?', count, (err, row) => {
      if (err) return console.error('Failed to get notes');
      send({table: 'node', data: row});
    });
  });
}
