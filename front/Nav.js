
import React from 'react';
import {Link} from 'react-router';

export default class Nav extends React.Component {
  static contextTypes = {
    router: React.PropTypes.func.isRequired,
  }

  render() {
    var items = [{
      title: 'View',
      name: 'view',
      params: {splat: ''},
    }, {
      title: 'Edit',
      name: 'edit',
    }];
    var routes = this.context.router.getCurrentRoutes();
    var lastRoute = routes[routes.length - 1];
    return (
      <ul style={styles.container}>
        {items.map(item => lastRoute.name === item.name ? (
          <li key={item.name} style={styles.active}>
            {item.title}
          </li>
        ) : (
          <li key={item.name} style={styles.item}>
            <Link style={styles.link} to={item.name} params={item.params}>
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
  link: {
    textDecoration: 'none',
    padding: '10px 20px',
    display: 'block',
    color: 'black',
  },
  item: {
    color: 'black',
    display: 'block',
  },
  active: {
    display: 'block',
    backgroundColor: '#aaa',
    padding: '10px 20px',
    color: 'white',
  },
};

