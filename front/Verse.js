
import Remarkable from './Remarkable';

export default class Verse {
  render() {
    const {number, text} = this.props.content;
    const marks = filterMarks(this.props.annotations, number, this.props.reference);
    return (
      <div style={styles.container}>
        <span style={styles.number}>{number}</span>
        <Remarkable
          activeMark={this.props.activeMark}
          onMoveMark={this.props.onMoveMark}
          onStartMove={this.props.onStartMove}
          reportMarkPos={this.props.reportMarkPos}
          marks={marks}
          words={text.split(' ')}
        />
      </div>
    );
  }
}

