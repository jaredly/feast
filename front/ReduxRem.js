
import React from 'react';
import {connect} from 'react-redux';
import actions from './actions';

import Remarkable from './Rem2';

class ReduxRem {
  render() {
    var {dispatch, ...props} = this.props;
    return (
      // $FlowFixMe not a ReactComponent
      <Remarkable
        {...props}
        {...actions(dispatch)}
      />
    );
  }
}

function select(state) {
  return {
    ...state.viewer,
    font: state.font,
    verses: state.verses,
    size: state.size,
  };
}

export default connect(select)(ReduxRem);

