
import React from 'react';
import NoteEditor from './NoteEditor';
import TagAhead from './TagAhead';

var COLORS = ['red', 'green', 'blue', 'purple'];
var TYPES = ['underline', 'highlight', 'sideline'];

export default class Editorial {
  render() {
    var currentColor = this.props.mark.getIn(['style', 'color']);
    var colors = COLORS.map(color => (
      <li key={color} style={{...styles.color, backgroundColor: color, ...(color === currentColor && styles.currentColor)}} onClick={() => this.props.setMarkColor(color)}>
      </li>
    ));

    var currentType = this.props.mark.get('type');;

    var types = TYPES.map(type => (
      <li key={type} style={{...styles.type, ...(type === currentType && styles.currentType)}} onClick={() => this.props.setMarkStyle(type)}>
        {type}
      </li>
    ));

    var tags = this.props.mark.get('tags').map(tid => {
      var tag = this.props.tags.get(tid);
      var color = tag.get('color');
      // TODO click a tag to search it?
      return (
        <li style={styles.tag} key={tid}>
          <div style={{
            ...styles.tagName,
            backgroundColor: color,
            borderColor: color,
          }}>{tag.get('name')}</div>
          <div style={styles.removeTag} onClick={() => this.props.removeTag(tid)}>&times;</div>
          <div style={{...styles.tagArrow, borderLeftColor: color}}>
          </div>
        </li>
      );
    });

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
          <TagAhead
            tags={this.props.tags}
            used={this.props.mark.get('tags')}
            onSelect={this.props.addTag}
            onCreate={this.props.newTag}
          />
        </div>
        <ul style={styles.tags}>
          {tags}
        </ul>
        {!!this.props.notes.size &&
          this.props.notes.map(note => (
            <NoteEditor
              note={note}
              key={note.get('id')}
              onNewNote={this.props.createNote}
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

  tags: {
    justifyContent: 'center',
    alignItems: 'center',
    listStyle: 'none',
    display: 'flex',
    margin: 0,
    padding: 0,
    marginTop: 10,
  },

  tag: {
    display: 'flex',
    marginRight: 10,
    position: 'relative',
  },

  removeTag: {
    position: 'absolute',
    cursor: 'pointer',
    top: '.15em',
    right: '.4em',
  },

  tagName: {
    padding: '.1em 10px',
  },

  tagArrow: {
    borderStyle: 'solid',
    borderWidth: '.7em 0 .7em .7em',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
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

