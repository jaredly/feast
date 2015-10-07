
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
    getActionsBetween: (first, second) =>
      post('getActionsBetween', {first, second}),
    addActions: actions =>
      post('addActions', {actions}),
    sync: ({actions, serverHead}) =>
      post('sync', {actions, serverHead})
  }
}

