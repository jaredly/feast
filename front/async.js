
import React from 'react';

/**
 * Takes a function and a component, and wraps the component, fetching some
 * async data you need.
 *
 * @asyncWrapper(props => a promise)
 * When the promise is loading, the Component gets loading=true on the props.
 * Once it has resolved, the object returned by the promise is spread into
 * Component's props.
 */
export default fn => Component => class Wrapper extends React.Component {
  displayName = 'AsyncWrapper(' + Component.name + ')';
  constructor(props) {
    super(props);
    this.state = {loading: false, data: null};
  }

  componentWillMount() {
    this.load(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.load(nextProps, this.props);
  }

  load(props, prevProps) {
    var val = fn(props, prevProps);
    if (!val) return;
    if (typeof val.then !== 'function') {
      return this.setState({data: val, error: null, loading: false});
    }
    this.setState({loading: true, error: null});
    val.then(
      data => this.setState({data, loading: false}),
      err => this.setState({error: err, loading: false})
    );
  }

  render() {
    return (
      <Component
        {...this.props}
        data={this.state.data}
        loading={this.state.loading}
        error={this.state.error}
      />
    );
  }
};

