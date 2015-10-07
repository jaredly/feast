
export const update = (id, update) => ({
  id,
  update,
  type: 'edit',
});

export const add = (id, text) => ({
  type: 'add',
  item: {
    id,
    text,
    added: new Date(),
    completed: false,
  },
  id,
});

export const remove = id => ({ type: 'remove', id, });

