
import React from 'react';
import NoteEditor from './NoteEditor';

var COLORS = ['red', 'green', 'blue', 'purple'];
var TYPES = ['underline', 'highlight', 'sideline'];

export default class Editorial {
  render() {
    var currentColor = this.props.mark.getIn(['style', 'color']);
    var colors = COLORS.map(color => (
      <li style={{...styles.color, backgroundColor: color, ...(color === currentColor && styles.currentColor)}} onClick={() => this.props.setMarkColor(color)}>
      </li>
    ));
    var currentType;
    if (this.props.mark.get('type') === 'sideline') {
      currentType = 'sideline';
    } else if (this.props.mark.getIn(['style', 'underline'])) {
      currentType = 'underline';
    } else {
      currentType = 'highlight';
    }
    var types = TYPES.map(type => (
      <li style={{...styles.type, ...(type === currentType && styles.currentType)}} onClick={() => this.props.setMarkStyle(type)}>
        {type}
      </li>
    ));
    return (
      <div style={styles.container}>
        <div style={styles.bar}>
          <ul style={styles.colors}>
            {colors}
          </ul>
          <ul style={styles.types}>
            {types}
          </ul>
          <div style={styles.button} onClick={this.props.removeMark}>
            delete
          </div>
          <div style={styles.button} onClick={this.props.createNote}>
            +note
          </div>
        </div>
        {!!this.props.notes.size &&
          this.props.notes.map(note => (
            <NoteEditor
              note={note}
              onChange={text => this.props.changeNote(note.get('id'), text)}
              onRemove={() => this.props.removeNote(note.get('id'))}
              onClose={() => this.props.cancelEdit()}
            />
          )).toArray()}
      </div>
    );
  }
}

var styles = {
  container: {
    position: 'fixed',
    backgroundColor: 'black',
    color: 'white',
    padding: 10,
    fontSize: 20,
    fontFamily: 'sans-serif',
    bottom: 0,
    left: 0,
    right: 0,
  },

  bar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },

  colors: {
    listStyle: 'none',
    margin: '0 5px',
    padding: 0,
  },
  types: {
    listStyle: 'none',
    margin: '0 5px',
    padding: 0,
  },
  color: {
    display: 'inline-block',
    border: '5px solid white',
    cursor: 'pointer',
    height: '1em',
    width: '1em',
    opacity: .4,
  },
  currentColor: {
    opacity: 1,
  },
  type: {
    display: 'inline-block',
    padding: '5px 10px',
    cursor: 'pointer',
  },
  currentType: {
    backgroundColor: '#555',
  },
  button: {
    padding: '5px 10px',
    cursor: 'pointer',
  },
};

