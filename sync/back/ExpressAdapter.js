
export default (app, remote) => {
  const get = (endp, handler) => {
    app.get('/' + endp, (req, res) => {
      handler().then(val => {
        res.set('content-type', 'application/json');
        res.end(JSON.stringify(val));
      }, err => {
        console.log('fail', err, err.stack);
        res.status(500);
        res.end(err.message);
      }).catch(err => console.log('WWWW', err));
    });
  }

  const post = (endp, handler) => {
    app.post('/' + endp, (req, res) => {
      handler(req.body).then(val => {
        res.set('content-type', 'application/json');
        res.end(JSON.stringify(val));
      }, err => {
        console.log('fail', err, err.stack);
        res.status(500);
        res.end(err.message);
      }).catch(err => console.log('WWWW', err));
    });
  }

  get('dump', () => remote.dump());
  post('sync', ({actions, serverHead, clientId}) =>
    remote.sync({actions, serverHead, clientId}));
}

