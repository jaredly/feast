
import {fromJS, Set, Map} from 'immutable';

export default {
  removeMark: {
    x(state, {id}) {
      return {
        marks: state.marks.delete(id),
      };
    },
    mut(state, {id}) {
      delete state.marks[id];
    },
    db(db, {id}) {
      return db.annotations.delete(id);
    },
  },

  setMarkStyle: {
    x(state, {id, style}) {
      return {
        marks: state.marks.setIn([id, 'type'], style),
      };
    },
    mut(state, {id, style}) {
      state.marks[id].type = style;
    },
    db(db, {id, style}) {
      return db.annotations.update(id, {type: style});
    },
  },

  changeNote: {
    x(state, {id, text}) {
      return {
        notes: state.notes.setIn([id, 'text'], text),
      };
    },
    mut(state, {id, text}) {
      state.notes[id].text = text;
    },
    db(db, {id, text}) {
      return db.notes.update(id, {text});
    },
  },

  createNote: {
    x(state, {id, mark, text}) {
      return {
        notes: state.notes.set(id, fromJS({id, mark, text})),
      };
    },
    mut(state, {id, mark, text}) {
      state.notes[id] = {id, mark, text};
    },
    db(db, {id, mark, text}) {
      return db.notes.put({id, annotation_id: mark, text});
    },
  },

  removeNote: {
    x(state, {id}) {
      return {
        notes: state.notes.delete(id),
      };
    },
    mut(state, {id}) {
      delete state.notes[id];
    },
    db(db, {id}) {
      return db.notes.delete(id);
    },
  },

  setMarkPos: {
    x(state, {id, handle, pos}) {
      var mark = state.marks.get(id);
      return {
        marks: state.marks.setIn([id, handle], pos),
      };
    },
    mut(state, {id, handle, pos}) {
      state.marks[id].handle = pos;
    },
    db(db, {id, handle, pos}, state) {
      return db.annotations.update(id, {
        [handle]: pos,
      });
    },
  },

  setMarkEnds: {
    x(state, {id, start, end}) {
      var mark = state.marks.get(id);
      return {
        marks: state.marks.mergeIn([id], {start, end}),
      };
    },
    mut(state, {id, start, end}) {
      state.marks[id].start = start;
      state.marks[id].end = end;
    },
    db(db, {id, start, end}) {
      return db.annotations.update(id, {
        start: start,
        end: end,
      });
    },
  },

  setMarkColor: {
    x(state, {id, color}) {
      return {
        marks: state.marks.setIn([id, 'style', 'color'], color),
      };
    },
    mut(state, {id, color}) {
      state.marks[id].style.color = color;
    },
    db(db, {id, color}) {
      return db.annotations.update(id, {'style.color': color});
    },
  },

  createAndAddTag: {
    x(state, {id, mid, name, namespace, color}) {
      return {
        marks: state.marks.updateIn([mid, 'tags'], tags => tags.add(id)),
        tags: state.tags.set(id, Map({id, name, namespace, color})),
      };
    },
    mut(state, {id, mid, name, namespace, color}) {
      state.marks[mid].tags.add(mid);
    },
    db(db, {id, mid, name, namespace, color}) {
      return Promise.all([
        db.annotations.where(':id').equals(mid).modify(obj => obj.tags.push(id)),
        db.tags.put({id, name, namespace, color}),
      ]);
    },
  },

  addTag: {
    x(state, {mid, tid}) {
      return {
        marks: state.marks.updateIn([mid, 'tags'], tags => tags.add(tid)),
      };
    },
    db(db, {mid, tid}) {
      return db.annotations.where(':id').equals(mid).modify(obj => obj.tags.push(tid));
    },
  },

  removeTag: {
    x(state, {mid, tid}) {
      return {
        marks: state.marks.updateIn([mid, 'tags'], tags => tags.delete(tid)),
      };
    },
    db(db, {mid, tid}) {
      return db.annotations.where(':id').equals(mid).modify(obj => {
        var ix = obj.tags.indexOf(tid);
        if (ix !== -1) obj.tags.splice(ix, 1);
      });
    },
  },

  addMark: {
    x(state, {mark}) {
      return {
        marks: state.marks.set(mark.id, myFromJS(mark)),
      };
    },
    db(db, {mark}) {
      return db.annotations.put(mark);
    },
  },
};

function isGreaterIm(pos1, pos2) {
  return (pos1.get('verse') > pos2.get('verse')) || (
    pos1.get('verse') === pos2.get('verse') &&
    pos1.get('word') > pos2.get('word')
  );
}

function balanceIm(mark) {
  if (isGreaterIm(mark.get('start'), mark.get('end'))) {
    return mark.set('start', mark.get('end'))
               .set('end', mark.get('start'));
  }
  return mark;
}

