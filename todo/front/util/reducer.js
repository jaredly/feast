
export default function reducer(state, {action, pid}) {
  if (!state) state = {items: {}, audit: []};
  switch (action.type) {
    case 'add':
      return {items: {...state.items, [action.id]: action.item}, audit: [...state.audit, pid]};
    case 'edit':
      if (!state.items[action.id]) return {...state, audit: [...state.audit, pid]};
      return {
        items: {
          ...state.items,
          [action.id]: {...state.items[action.id], ...action.update}
        },
        audit: [...state.audit, pid]
      };
    case 'remove':
      if (!state.items[action.id]) {
        return {
          ...state,
          audit: [...state.audit, pid]
        };
      }
      var items = {...state.items};
      delete items[action.id];
      return {items, audit: [...state.audit, pid]};
  }
  return state;
}

