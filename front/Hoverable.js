
import React from 'react';

export default class Hoverable extends React.Component {
  constructor() {
    super();
    this.state = {hover: false};
  }
  render() {
    var style = this.props.style;
    if (this.state.hover && !this.props.disabled) {
      style = {...style, ...this.props.hoverStyle};
    }
    var Base = this.props.base || 'div';
    return (
      <Base
        {...this.props}
        onMouseOver={!this.props.disabled && () => !this.state.hover && this.setState({hover: true})}
        onMouseOut={!this.props.disabled && () => this.state.hover && this.setState({hover: false})}
        style={style}
      />
    );
  }
}

