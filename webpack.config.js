'use strict';

module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: './front/run',
  output: {
    path: __dirname + '/build', // eslint-disable-line no-path-concat
    filename: 'build.js',
  },

  module: {
    loaders: [{
      test: /\.jsx?$/,
      loader:  'babel-loader?stage=0',
      exclude: [
        'node_modules',
      ],
    }]
  },
};


