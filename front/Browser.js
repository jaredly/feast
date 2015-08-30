
import React from 'react';
import db from './db';

import ReduxRem from './ReduxRem';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import Hoverable from './Hoverable';
import reducers from './reducers';
import parseContent from './parseContent';

window.db = db;

var BOOK = {
  title: 'Book of Mormon',
  uri: '/scriptures/bofm',
  id: 0,
};

function getPath(node) {
  if (node.parent_id == 0) return Promise.resolve([BOOK]);
  return db.node.where('id').equals(node.parent_id).first()
    .then(
      val => {
        return getPath(val).then(path => path.concat([val]))
      }
    );
  //return db.node.get(node.parent_id, val => val ? getPath(val).then(path => path.concat([val])) : [])
}

export default class Browser extends React.Component {
  constructor() {
    super();
    this.state = {
      current: BOOK,
      path: [],
      loading: true,
    };
  }

  componentDidMount() {
    if (window.location.hash) {
      this.initFromHash(window.location.hash.slice(1));
    } else {
      this.getChildren(this.state.current.id);
    }
  }

  initFromHash(hash) {
    db.node.where('uri').equals(hash).first(
      current => {
        console.log('ash', current);
        if (!current) {
          return this.getChildren(this.state.current.id);
        }
        this.loadFull(current);
      },
      err => this.getChildren(this.state.current.id)
    ).catch(err => console.log('fail! hash', err));
  }

  loadFull(node) {
    getPath(node).then(path => {
      this.setState({path});
      this.goToNode(node);
    }, err => {
      console.log('failed to get path', err);
    });
  }

  getChildren(id) {
    db.node.where('parent_id').equals(id).toArray(children => {
      children.sort((a, b) => a.display_order - b.display_order);
      this.setState({loading: false, children});
    });
  }

  goToNode(node) {
    window.location.hash = node.uri;
    if (node.content) {
      this.setState({
        loading: true,
        current: node,
        children: null
      });
      this.getMarks(node);
      return;
    }
    this.setState({loading: true, current: node});
    this.getChildren(node.id);
  }

  goToChild(node) {
    this.setState({path: this.state.path.concat([this.state.current])});
    this.goToNode(node);
  }

  getMarks(node) {
    db.annotations
      .where('node_uri_start').equals(node.uri)
      .or('node_uri_end').equals(node.uri)
      .toArray(annotations => {
        db.tags.toArray(tags => {
          var ids = annotations.map(ann => ann.id);
          db.notes.where('annotation_id').anyOf(ids).toArray(notes => {
            this.setState({
              loading: false,
              dbdata: {
                annotations,
                tags,
                notes,
              }
            });
          });
        });
      });
  }

  getContents() {
    if (this.state.children) {
      return (
        <ul style={styles.children}>
          {this.state.children.map(child => (
            <Hoverable
              key={child.id}
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
      return <h1>Loading...</h1>;
    }
    if (this.state.current.content) {
      return this.renderViewer();
    }
  }

  renderViewer() {
    var chapter = parseContent(this.state.current.content);

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
    this.state.dbdata.notes.forEach(note => notes[note.id] = note);
    var tags = {};
    this.state.dbdata.tags.forEach(tag => tags[tag.id] = tag);
    var marks = {};
    this.state.dbdata.annotations.forEach(mark => marks[mark.id] = mark);

    var store = createStore(reducers(chapter.verses, marks, tags, notes));

    return (
      <Provider store={store}>
        {() => <ReduxRem uri={this.state.current.uri} size={size} font={font} />}
      </Provider>
    );
  }

  goToPath(i) {
    var path = this.state.path.slice(0, i);
    var current = this.state.path[i];
    window.location.hash = current.uri;
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
        key={item.id + i}
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

