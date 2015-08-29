
import React from 'react';
import db from './db';

import ReduxRem from './ReduxRem';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import Hoverable from './Hoverable';
import reducers from './reducers';
import parseContent from './parseContent';

window.db = db;

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
      this.setState({
        loading: true,
        current: node,
        path: this.state.path.concat([this.state.current]),
        children: null
      });
      this.getMarks(node);
      return;
    }
    this.setState({loading: true, path: this.state.path.concat([this.state.current]), current: node});
    this.getChildren(node.id);
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

