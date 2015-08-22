
import React from 'react';

var COLORS = ['red', 'green', 'blue', 'purple'];
var TYPES = ['underline', 'highlight', 'sideline'];

export default class Editorial {
  render() {
    var currentColor = this.props.mark.getIn(['style', 'color']);
    var colors = COLORS.map(color => (
      <li style={{...styles.color, backgroundColor: color, ...(color === currentColor && styles.currentColor)}} onClick={() => this.props.setMarkColor(color)}>
        {color}
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
    padding: '5px 10px',
    cursor: 'pointer',
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
};

