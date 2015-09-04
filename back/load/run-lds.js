
import {Server} from 'ws';
import superagent from 'superagent';

import ldsLogin from './lds';

var wss = new Server({port: 7331});

wss.on('connection', ws => {
  var did = false;
  ws.on('message', raw => {
    if (did) return;
    did = true;
    var data = JSON.parse(raw);
    console.log('Received message', raw);
    handleConnection(data, data => ws.send(JSON.stringify(data)));
  });
});

function handleConnection(data, send) {
  console.log('logging in');
  ldsLogin(data.username, data.password, (err, token) => {
    if (err) {
      console.error('Failed to login!', err);
      return;
    }
    console.log('getting page');
    getPage(token, 1, 50, (err, val) => {
      console.log('got page', err, val);
      send(val);
    });
  });
}

function getPage(token, num, size, done) {
  var url = 'https://www.lds.org/study-tools/ajax/highlight/getFiltered?lang=eng&before=&facets=&guid=all&numberToReturn=' + size + '&searchFields=&searchPhrase=&since=&start=' + num + '&tag=&type=';
  superagent.get(url)
    .set('cookie', 'ObSSOCookie=' + token)
    .end((err, res) => {
      console.log(res);
      done(err, res && res.body);
    });
}


console.log('ready');
