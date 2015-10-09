require('babel-core/polyfill');

import '../util/enable-debug';
import db from './db';
import * as dbOptions from './local-db';
import DexieAdapter from '../../../sync/front/DexieDB';
import setupShared from '../../../sync/front/setup-shared';
import rebaser from '../util/rebaser';

const shared = self.shared = setupShared({
  url: 'localhost:6110',
  local: new DexieAdapter(db, dbOptions),
  rebaser,
});
