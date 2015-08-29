
var db = new Dexie('feast');

db.version(1).stores({
  book: 'uri',
  node: 'uri, parent_id',
  annotation: 'id, node_uri_start, node_uri_end',
})
db.version(2).stores({
  book: 'uri',
  node: 'uri, id, parent_id',
  annotation: 'id, node_uri_start, node_uri_end',
});
db.version(3).stores({
  book: 'uri',
  node: 'uri, id, parent_id',
  study: 'id', // studies!!
  annotation: 'id, study_id, node_uri_start, node_uri_end',
  note: 'id, annotation_id',
  tag: 'id, namespace',
});

db.open().catch(err => console.error('failed to open db', err));

export default db;
