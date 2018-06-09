const Database = require('./database');
const StoreBase = require('./store-base');

class DocumentSnapshotStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documentSnapshots);
  }
}

module.exports = DocumentSnapshotStore;
