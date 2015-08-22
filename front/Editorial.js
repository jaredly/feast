
import React from 'react';

var COLORS = ['red', 'green', 'blue', 'purple'];
var TYPES = ['underline', 'highlight', 'sideline'];

export default class Editorial {
  render() {
    var colors = COLORS.map(color => (
      <li style={styles.color} onClick={() => this.props.setMarkColor(color)}>
        {color}
      </li>
    ));
    var types = TYPES.map(type => (
      <li style={styles.type} onClick={() => this.props.setMarkStyle(type)}>
        {type}
      </li>
    ));
    return (
      <div style={styles.container}>
        <ul style={styles.colors}>
          {colors}
        </ul>
        <ul style={styles.types}>
          {types}
        </ul>
      </div>
    );
  }
}

var styles = {
  container: {
    position: 'fixed',
    backgroundColor: 'black',
    color: 'white',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    fontSize: 20,
    fontFamily: 'sans-serif',
    bottom: 0,
    left: 0,
    right: 0,
  },
  colors: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  types: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  color: {
    display: 'inline-block',
    padding: '5px 10px',
    cursor: 'pointer',
  },
  type: {
    display: 'inline-block',
    padding: '5px 10px',
    cursor: 'pointer',
  },
};

