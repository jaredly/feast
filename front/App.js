
export default class App {
  render() {
    return (
      <div style={styles.container}>
        <DoublePane
          left={() => <ScriptureView />}
          right={() => <JournalView />}
        />
      </div>
    );
  }
}

