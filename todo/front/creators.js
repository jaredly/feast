
export const update = (id, update) => ({
  id,
  update,
  type: 'edit',
});

export const add = (id, text, color) => ({
  type: 'add',
  item: {
    id,
    text,
    color,
    added: new Date(),
    completed: false,
  },
  id,
});

export const remove = id => ({ type: 'remove', id, });

