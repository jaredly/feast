
export default function reducer(state, {action}) {
  if (!state) state = {items: {}};
  switch (action.type) {
    case 'add':
      return {items: {...state.items, [action.id]: action.item}};
    case 'edit':
      return {items: {...state.items, [action.id]: {...state.items[action.id], ...action.update}}};
    case 'remove':
      var items = {...state.items};
      delete items[action.id];
      return {items};
  }
  return state;
}

