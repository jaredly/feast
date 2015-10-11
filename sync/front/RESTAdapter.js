// @flow

import axios from 'axios';

import type {Remote} from './types';

export default function<Action> (base: string): Remote<Action> {
  const get = endp =>
    axios.get(base + endp)
    .then(res => res.data);
  const post = (endp, data) =>
    axios.post(base + endp, data)
    .then(res => res.data);

  return {
    dump: () => get('dump'),
    sync: ({actions, serverHead, clientId}) =>
      post('sync', {actions, serverHead, clientId})
  }
}

