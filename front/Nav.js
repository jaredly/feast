
import React from 'react';
import {Link} from 'react-router';

export default class Nav {
  render() {
    var items = [{
      title: 'View',
      name: 'view',
      params: {splat: ''},
    }, {
      title: 'Edit',
      name: 'edit',
    }];
    return (
      <ul style={styles.container}>
        {items.map(item => (
          <li key={item.name}>
            <Link style={styles.item} params={item.params} activeStyle={styles.active} to={item.name}>
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    );
  }
};

var styles = {
  container: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
  },
  item: {
    textDecoration: 'none',
    padding: '10px 20px',
    color: 'black',
    display: 'block',
  },
  active: {
    display: 'block',
    backgroundColor: '#aaa',
    textDecoration: 'none',
    padding: '10px 20px',
    color: 'white',
  },
};

