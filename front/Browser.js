
import React from 'react';
import db from './db';

import ReduxRem from './ReduxRem';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import Hoverable from './Hoverable';
import reducers from './reducers';

window.db = db;

function parse_content(text) {
  var node = document.createElement('div');
  node.innerHTML = text;
  node = node.firstChild;
  ;[].map.call(node.querySelectorAll('sup'), s => s.parentNode.removeChild(s));
  ;[].map.call(node.querySelectorAll('.verseNumber'), s => s.parentNode.removeChild(s));
  var verses = [].map.call(node.querySelectorAll('p.verse'), p => ({
    words: p.textContent.split(/\s+/g),
    uri: p.getAttribute('uri'),
    num: p.getAttribute('id'),
  }));
  var intro = node.querySelector('p.studySummery');
  if (intro) {
    intro = intro.textContent;
  }
  return {
    intro,
    verses,
  };
}

export default class Browser extends React.Component {
  constructor() {
    super();
    this.state = {
      current: {
        title: 'Book of Mormon',
        id: 0,
      },
      path: [],
      loading: true,
    };
  }

  componentDidMount() {
    this.getChildren(this.state.current.id);
  }

  getChildren(id) {
    db.node.where('parent_id').equals(id).toArray(children => {
      this.setState({loading: false, children});
    });
  }

  goToChild(node) {
    if (node.content) {
      return this.setState({current: node, path: this.state.path.concat([this.state.current]), children: null});
    }
    this.setState({loading: true, path: this.state.path.concat([this.state.current]), current: node});
    this.getChildren(node.id);
  }

  goBack() {
    if (!this.state.path.length) {
      return;
    }
    var current = this.state.path.slice(-1)[0];
    this.setState({
      current,
      path: this.state.path.slice(0, -1),
    });
    this.getChildren(current.id);
  }

  getContents() {
    if (this.state.children) {
      return (
        <ul style={styles.children}>
          {this.state.children.map(child => (
            <Hoverable
              style={styles.child}
              hoverStyle={styles.childHover}
              onClick={() => this.goToChild(child)}
              base='li'
            >
              {child.title}
            </Hoverable>
          ))}
        </ul>
      );
    }
    if (this.state.loading) {
      return null;
    }
    if (this.state.current.content) {
      return this.renderViewer();
    }
  }

  renderViewer() {
    var chapter = parse_content(this.state.current.content);

    var size = {
      width: 1000,
      vmargin: 50,
      hmargin: 300,
    };
    var fontSize = 25;
    var font = {
      family: 'serif',
      space: fontSize / 3,
      lineHeight: fontSize * 1.4,
      size: fontSize,
      indent: fontSize,
    };

    var notes = {};
    var tags = {};
    var marks = {};

    var store = createStore(reducers(chapter.verses, marks, tags, notes));

    return (
      <Provider store={store}>
        {() => <ReduxRem size={size} font={font} />}
      </Provider>
    );
  }

  render() {
    return (
      <div style={styles.container}>
        <Hoverable
          disabled={this.state.current.parent_id == null}
          onClick={this.goBack.bind(this)}
          style={styles.title}
          hoverStyle={styles.titleHover}
        >
          {this.state.current.title}
        </Hoverable>
        <div style={styles.contents}>
          {this.getContents()}
        </div>
      </div>
    );
  }
}

var styles = {
  container: {
    padding: 10,
  },
  title: {
    cursor: 'pointer',
    padding: '10px 20px',
  },
  titleHover: {
    backgroundColor: 'white',
  },
  children: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

  child: {
    padding: '10px 20px',
    cursor: 'pointer',
  },

  childHover: {
    backgroundColor: 'white',
  },
};

