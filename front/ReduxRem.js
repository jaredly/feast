
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
        /*
        setEditHandle={this.setEditHandle.bind(this)}
        setPendingEnd={this.setPendingEnd.bind(this)}
        setEditPos={this.setEditPos.bind(this)}
        stopEditing={this.stopEditing.bind(this)}
        finishCreating={this.finishCreating.bind(this)}
        startEditing={this.startEditing.bind(this)}
        startCreating={this.startCreating.bind(this)}
        finishEditMove={this.finishEditMove.bind(this)}
        */
      />
    );
  }
}

function select(state) {
  return state.viewer;
}

export default connect(select)(ReduxRem);

