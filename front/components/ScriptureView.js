
import React from 'react';
import asyncWrapper from './async';
import {fetchScripture} from './api';

import Verse from './Verse';

const cache = {};

@connect(a, b)
@asyncWrapper((props, prevProps) => {
  if (prevProps && props.reference === prevProps.reference) {
    return;
  }
  const key = props.reference.join(':');
  if (cache[key]) {
    return cache[key];
  }
  return fetchScripture(props.reference).then(content => {
    cache[key] = content;
    return content;
  });
})
export default class ScriptureView {
  render() {
    if (this.props.loading) {
      return (
        <div style={styles.loading}>
          Loading {this.props.reference}...
        </div>
      );
    }
    if (this.props.error) {
      return (
        <div style={styles.error}>
          Failed to get reference: {this.props.reference}
        </div>
      );
    }
    if (!this.props.data) {
      return (
        <div style={styles.error}>
          Unknown reference: {this.props.reference}
        </div>
      );
    }

    return (
      <div style={styles.container}>
        <div style={styles.header}>
        </div>
        <div style={styles.verses}>
          {this.props.data.map(verse => (
            <div style={styles.verse}>
              <Verse
                content={verse}
                reference={this.props.reference}
                annotations={this.props.annotations}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
}

const styles = {
};
