
import axios from 'axios';

export default base => {
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

