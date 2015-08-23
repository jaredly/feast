
import React from 'react';

export default class NoteEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {text: this.props.note.get('text')};
    this._bounce = debounce(this.props.onChange);
  }

  onChange(e) {
    this.setState({text: e.target.value});
    this._bounce(e.target.value);
  }

  onBlur() {
    if (!this._bounce.cancel()) {
      this.props.onChange(this.state.text);
    }
  }

  componentWillUnmount() {
    if (!this._bounce.cancel()) {
      this.props.onChange(this.state.text);
    }
  }

  render() {
    return (
      <div style={styles.editor}>
        <textarea
          style={styles.text}
          value={this.state.text}
          onChange={this.onChange.bind(this)}
          onBlur={this.onBlur.bind(this)}
        />
        <div onClick={this.props.onRemove} style={styles.delete}>
          &times;
        </div>
      </div>
    );
  }
}

var styles = {
  editor: {
    position: 'relative',
  },

  delete: {
    position: 'absolute',
    right: 5,
    top: 10,
    cursor: 'pointer',
  },
  text: {
    width: '100%',
    border: 0,
    boxSizing: 'border-box',
    padding: '5px 10px',
    backgroundColor: '#222',
    color: 'white',
    marginTop: 10,
  },
};

function debounce(fn) {
  var min = 500;
  var wait = null;
  var wrap = function () {
    clearTimeout(wait);
    wait = setTimeout(() => {
      fn.apply(this, arguments)
      wait = null;
    }, min);
  };
  wrap.cancel = () => wait === null ? true : (clearTimeout(wait), wait = null, false);
  return wrap;
}

