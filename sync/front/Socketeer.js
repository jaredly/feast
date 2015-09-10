/**
 * This is a socket manager that allows you to expect reponses to things, and
 * actually locks until you have received the response (dropping all
 * intermediate messages).
 *
 * This might not be quite what I want in the future, but it sounds pretty
 * good at the moment.
 */

// types of messages
//
// SNED
// - > dump
// - > update
//
// REVC
// - < dump
// - < update:ok
// - < update:rebase
// - > new stuff

import prom from './prom';

var gen = () => Math.random().toString(16).slice(2);

export default class Socketeer {
  constructor(config, onMessage) {
    this.config = config;
    this.waiting = null;
    this.config.listen(data => this.handle(data));
    this.onMessage = onMessage;
  }

  send(type, args) {
    return prom(done => {
      var syncid = gen();
      this.waiting = {
        type,
        done,
        syncid,
      };
      this.config.send({type, syncid, args});
    });
  }

  handle(data) {
    if (!this.waiting) {
      return this.onMessage(data);
    }
    if (data.type !== this.waiting.type || data.syncid !== this.waiting.syncid) {
      if (data.syncid) {
        return console.warn('Dropping an unpaired response', data, this.config.breakSync, this.waiting);
      }
      if (this.config.breakSync) {
        console.warn('breaking sync', this.waiting);
        this.waiting = null;
        this.onMessage(data);
      } else {
        console.warn('Ignoring message', data, 'waiting for', this.waiting.type);
      }
      return;
    }
    var done = this.waiting.done;
    this.waiting = null;
    if (data.err) {
      done(data.err);
    } else {
      done(null, data.val);
    }
  }
}

