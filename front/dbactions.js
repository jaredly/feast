
import {fromJS, Set, Map} from 'immutable';

export default {
  removeMark: {
    x(state, {id}) {
      return {
        marks: state.marks.delete(id),
      };
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
    db(db, {id}) {
      return db.notes.delete(id);
    },
  },

  // TODO make this state independant? e.g. pass in "shouldFlip" or not? or
  // something...
  setMarkPos: {
    x(state, {id, handle, pos}) {
      var mark = state.marks.get(id);
      return {
        marks: state.marks.set(id, balanceIm(mark.set(handle, pos))),
      };
    },
    db(db, {id, handle, pos}, state) {
      var other = handle === 'start' ? 'end' : 'start';
      if (isGreaterIm(mark.get(handle), mark.get(other))) {
        return db.annotations.update(id, {
          end: pos,
          start: mark.get(other).toJS(),
        });
      }
      return db.annotations.update(id, {
        start: pos,
        end: mark.get(other).toJS(),
      });
    },
  },

  setMarkColor: {
    x(state, {id, color}) {
      return {
        marks: state.marks.setIn([id, 'style', 'color'], color),
      };
    },
    db(db, {id, color}) {
      return db.annotations.update(id, {'style.color': color});
    },
  },

  createAndAddTag: {
    x(state, {id, mid, name, namespace, color}) {
      console.log('new tag', mid, text, id);
      return {
        marks: state.marks.updateIn([mid, 'tags'], tags => tags.add(id)),
        tags: state.tags.set(id, Map({id, name, namespace, color})),
      };
    },
    db(db, {id, mid, text, color}) {
      return Promise.all([
        db.annotations.where(':id').equals(mid).modify(obj => obj.tags.push(id)),
        db.tags.put({id, text, color}),
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
        marks: state.marks.set(mark.get('id'), mark),
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

