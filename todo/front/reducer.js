
export default function reducer(state, {action}) {
  if (!state) state = {items: {}};
  switch (action.type) {
    case 'add':
      return {items: {...state.items, [action.id]: action.item}};
    case 'edit':
      if (!state.items[action.id]) return state;
      return {items: {...state.items, [action.id]: {...state.items[action.id], ...action.update}}};
    case 'remove':
      if (!state.items[action.id]) return state;
      var items = {...state.items};
      delete items[action.id];
      return {items};
  }
  return state;
}

