import {EventEmitter} from 'events';
import Tab from './Tab';

export default ({
  rebaser,
  reducer,
  sharedPath,
}) => {
  const worker = new SharedWorker(sharedPath);
  worker.onerror = err => console.log('Shared worker failed to start', err);
  const shared = new EventEmitter();
  shared.send = data => worker.port.postMessage(data);
  worker.port.onmessage = e => {
    try {
      shared.emit('message', e.data);
    } catch (e) {
      console.error('processing message from shared failed', e, e.stack, e.data);
    }
  };

  const tab = new Tab(shared, reducer, rebaser);
  return tab.init().then(() => tab);
};
