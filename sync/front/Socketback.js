
var p = v => Promise.resolve(v);

export default class Socketback {
  constructor(config, responders) {
    this.config = config;
    this.responders = responders;
    this.config.listen(data => this.handle(data));
  }

  send(data) {
    this.config.send(data);
  }

  handle(data) {
    p(this.responders[data.type](data.args)).then(
      val => this.config.send({
        syncid: data.syncid,
        type: data.type,
        val,
      }),
      err => this.config.send({
        syncid: data.syncid,
        type: data.type,
        err,
      })
    );
  }
}

