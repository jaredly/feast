
import React from 'react';
import {connect} from 'react-redux';
import actions from './actions';

import Viewer from './Viewer';
import Remarkable from './Rem2';

class ReduxRem {
  render() {
    var {dispatch, ...props} = this.props;
    return (
      // $FlowFixMe not a ReactComponent
      <Viewer
        {...props}
        {...actions(dispatch)}
      />
    );
  }
}

function select(state) {
  return state;
}

export default connect(select)(ReduxRem);

