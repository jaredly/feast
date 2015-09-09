
export default (app, db, reduce) => {
  app.get('/:head/poll', (req, res) => {
    db.getActionsSince(req.params.head).then(
      ({actions, head}) => res.json({actions, head, oldHead: req.params.head}),
      err => res.status(500).json({error: err})
    );
  });

  app.get('/dump', (req, res) => {
    db.getActionsSince(0).then(({actions, head}) => {
      var data = actions.reduce((state, action) => reduce(state, action), null);
      res.json({data, head});
    }, err => res.status(500).json({error: err, message: 'failed to get actions from db'}));
  });

  app.post('/:head/update', (req, res) => {
    db.tryAddActions(req.body, req.params.head).then(
      result => {
        if (result.rebase) {
          res.json({rebase: result.rebase, head: result.head});
        } else {
          res.json({head: result.head});
        }
      },
      error => res.status(500).json({error})
    );
  });
};

