
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
      children.sort((a, b) => a.display_order - b.display_order);
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

  goToPath(i) {
    var path = this.state.path.slice(0, i);
    var current = this.state.path[i];
    this.setState({
      current,
      path,
    });
    this.getChildren(current.id);
  }

  renderBreadcrumb() {
    var parents = this.state.path.map((item, i) => (
      <Hoverable
        base='li'
        onClick={() => this.goToPath(i)}
        style={styles.breadcrumbItem}
        hoverStyle={styles.breadcrumbHover}
      >
        {item.title}
      </Hoverable>
    ));
    return (
      <ul style={styles.breadcrumb}>
        {parents}
        <li style={styles.title}>
          {this.state.current.title}
        </li>
      </ul>
    );
  }

  render() {
    return (
      <div style={styles.container}>
        {this.renderBreadcrumb()}
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

  children: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

  breadcrumb: {
    listStyle: 'none',
    display: 'flex',
    margin: 0,
    padding: 0,
  },

  breadcrumbItem: {
    padding: '10px 20px',
    cursor: 'pointer',
  },

  breadcrumbHover: {
    backgroundColor: 'white',
  },

  title: {
    padding: '10px 20px',
    backgroundColor: '#ddd',
  },

  child: {
    padding: '10px 20px',
    cursor: 'pointer',
  },

  childHover: {
    backgroundColor: 'white',
  },
};

