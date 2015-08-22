
import React from 'react';

var COLORS = ['red', 'green', 'blue', 'purple'];
var TYPES = ['underline', 'highlight', 'sideline'];

export default class Editorial {
  render() {
    var colors = COLORS.map(color => (
      <li onClick={() => this.props.setMarkColor(color)}>
        {color}
      </li>
    ));
    var types = TYPES.map(type => (
      <li onClick={() => this.props.setMarkStyle(type)}>
        {type}
      </li>
    ));
    return (
      <div>
        {colors}
        {types}
      </div>
    );
  }
}

