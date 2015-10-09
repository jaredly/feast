
if (!self.document) {
  // needed by the debug module
  self.document = {documentElement: {style: {WebkitAppearance: true}}};
}
self.dbg = require('debug')
self.dbg.enable('*info,*warn,*error')

