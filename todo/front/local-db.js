
import DexieAdapter from '../../sync/front/DexieDB';

function applyAction(db, action) {
  switch (action.type) {
    case 'add':
      return db.items.add(action.item);
    case 'edit':
      return db.items.update(action.id, action.update);
    case 'remove':
      return db.items.delete(action.id);
  }
}

function dump(db) {
  return db.items.toArray().then(
    items => ({items: items.reduce(
      (data, item) => (data[item.id] = item, data),
      {}
    )})
  );
}

function setData(db, data) {
  if (!data || !data.items) return;
  return Promise.all(Object.keys(data.items).map(
    id => db.items.add(data.items[id])
  ));
}

export default db => new DexieAdapter(db, [db.items], applyAction, dump, setData)

