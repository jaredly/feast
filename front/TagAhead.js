
import React from 'react';

export default class TagStates extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      selected: 0,
      results: null,
    };
  }

  reset() {
    this.setState({
      text: '',
      results: null,
      selected: 0,
    });
  }

  onChange(text) {
    var needle = text.toLowerCase();
    var results = this.props.tags
      .filter((tag, tid) => !this.props.used.has(tid) && tag.get('name').toLowerCase().indexOf(needle) !== -1).toList()
    this.setState({
      text,
      selected: results.size ? 0 : 'new',
      results,
    });
  }

  onKeyDown(e) {
    if (e.key === 'Enter') {
      this.onSubmit();
      this.reset();
      return;
    }
    if (e.key === 'Escape') {
      this.reset();
      document.activeElement.blur();
      return;
    }
    var selected = this.getNextSelection(e.key);
    if (selected != null) {
      e.preventDefault();
      this.setState({selected});
    }
  }

  getNextSelection(key) {
    if (key === 'ArrowUp') {
      return this.goUp();
    } else if (key === 'ArrowDown') {
      return this.goDown();
    }
  }

  goDown() {
    if (this.state.selected === 'new') {
      if (!this.state.results || !this.state.results.size) {
        return;
      }
      return this.state.results.size - 1;
    }
    if (this.state.selected === 0) {
      return 'new';
    }
    return this.state.selected - 1;
  }

  goUp() {
    if (this.state.selected === 'new') {
      if (!this.state.results || !this.state.results.size) {
        return;
      }
      return 0;
    }
    if (this.state.selected === this.state.results.size - 1) {
      return 'new';
    }
    return this.state.selected + 1;
  }

  onSubmit() {
    if (this.state.selected === 'new') {
      if (!this.state.text.length) {
        return e.preventDefault();
      }
      this.props.onCreate(this.state.text);
      this.reset();
      return;
    }
    if (!this.state.results || this.state.selected >= this.state.results.size) {
      return;
    }
    this.props.onSelect(this.state.results.getIn([this.state.selected, 'id']));
  }

  render() {
    return <TagAhead
      {...this.props}
      {...this.state}
      onBlur={this.reset.bind(this)}
      onChange={this.onChange.bind(this)}
      onKeyDown={this.onKeyDown.bind(this)}
    />;
  }
}

class TagAhead extends React.Component {
  render() {
    return (
      <div style={styles.container}>
        {this.props.results && <ul style={styles.results}>
          {this.props.results.map((tag, i) => (
            <li style={i === this.props.selected ?
              {...styles.result, ...styles.selected} : styles.result
            }>
              {tag.get('name')}
            </li>
          )).reverse()}
          <li style={'new' === this.props.selected ?
            {...styles.result, ...styles.selected} : styles.result
          }>Create tag {this.props.text}</li>
        </ul>}
        <input
          style={styles.input}
          value={this.props.text}
          onChange={e => this.props.onChange(e.target.value)}
          onBlur={this.props.onBlur}
          onKeyDown={this.props.onKeyDown}
          placeholder='Add a Tag'
        />
      </div>
    );
  }
}

var styles = {
  container: {
    position: 'relative',
  },

  input: {
    padding: '5px 10px',
    border: 'none',
    fontSize: 16,
    color: 'white',
    backgroundColor: '#333',
  },

  results: {
    position: 'absolute',
    bottom: '100%',
    width: 200,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },

  selected: {
    backgroundColor: '#acf',
  },

  result: {
    padding: '5px 10px',
    backgroundColor: 'white',
    color: 'black',
    cursor: 'pointer',
  },
};

