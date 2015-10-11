
export const tables = db => [db.items, db.audit];

export const applyAction = (db, action, pid) => {
  switch (action.type) {
    case 'add':
      return Promise.all([
        db.items.add(action.item),
        db.audit.add({pid}),
      ]);
    case 'edit':
      return Promise.all([
        db.items.update(action.id, action.update),
        db.audit.add({pid})
      ]);
    case 'remove':
      return Promise.all([
        db.items.delete(action.id),
        db.audit.add({pid}),
      ]);
  }
}

export const dump = (db) => {
  return Promise.all([db.items.toArray(), db.audit.toArray()]).then(
    ([items, audit]) => ({
      items: items.reduce(
        (data, item) => (data[item.id] = item, data),
        {}
      ),
      audit: audit.sort((a, b) => a.num - b.num),
    })
  );
}

export const setData = (db, data) => {
  if (!data || !data.items) return;
  return Promise.all([
    ...Object.keys(data.items).map(
      id => db.items.add(data.items[id])
    ),
    ...data.audit.map(pid => db.audit.add({pid})),
  ]);
}

