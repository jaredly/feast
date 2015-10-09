
export const tables = db => [db.items];

export const applyAction = (db, action) => {
  switch (action.type) {
    case 'add':
      return db.items.add(action.item);
    case 'edit':
      return db.items.update(action.id, action.update);
    case 'remove':
      return db.items.delete(action.id);
  }
}

export const dump = (db) => {
  return db.items.toArray().then(
    items => ({items: items.reduce(
      (data, item) => (data[item.id] = item, data),
      {}
    )})
  );
}

export const setData = (db, data) => {
  if (!data || !data.items) return;
  return Promise.all(Object.keys(data.items).map(
    id => db.items.add(data.items[id])
  ));
}

