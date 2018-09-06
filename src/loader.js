'use strict';

var os = require('os');
var path = require('path');

var ExtractTextPlugin = require('extract-text-webpack-plugin');

var util = require('./util');

module.exports = function(options, firstRun) {
  var srcPath = util.cwdPath(options.src);
  if (options.includes) {
    srcPath = [
      srcPath
    ].concat(options.includes.map(function(include) {
      return util.cwdPath(include);
    }));
  }
  var exportcss = options.exportcss !== false;
  var presets = util.babel('preset', [
    {
      name: 'es2015',
      options: {
        loose: !!options.loose
      }
    },
    'stage-0',
    'react'
  ]);
  var cacheDirectory = path.join(os.tmpdir(), options.loose ? 'babel-loose' : 'babel-strict');
  var makeLoader = function(remainLoader) {
    var loaders = 'css-loader';
    if (remainLoader) {
      loaders += '!' + remainLoader + '-loader';
    }
    if (exportcss) {
      if (firstRun) {
        return ExtractTextPlugin.extract('style-loader', loaders);
      } else {
        return 'export-css-loader?remove=true&write=false!' + loaders;
      }
    } else {
      return 'style-loader!' + loaders;
    }
  }
  var plugins = [
    'add-module-exports',
    'transform-decorators-legacy',
    'transform-es3-member-expression-literals',
    'transform-es3-property-literals',
    {
      name: 'transform-runtime',
      options: {
        polyfill: !!options.polyfill,
        helpers: false,
        regenerator: true
      }
    }
  ];
  if (options.loose) {
    plugins.push('transform-proto-to-assign');
  }
  return [{
    test: /\.jsx?$/,
    loader: 'babel-loader',
    include: srcPath,
    options: {
      plugins: util.babel('plugin', plugins),
      presets: presets,
      cacheDirectory: cacheDirectory,
      babelrc: false
    }
  }, {
    test: /\.js$/,
    use: 'es3ify-loader',
    include: function(path) {
      return ~path.indexOf('babel-runtime');
    }
  }, {
    test: /\.css$/,
    use: makeLoader(),
  }, {
    test: /\.less$/,
    use: makeLoader('less'),
  }, {
    test: /\.styl$/,
    use: makeLoader('stylus'),
  }, {
    test: /\.svg$/,
    loader: 'babel-loader',
    options: {
      presets: presets,
      cacheDirectory: cacheDirectory,
      babelrc: false
    }
  }, {
    test: /\.svg$/,
    use: 'svg2react-loader',
  }, {
    test: /\.json$/,
    use: 'json-loader',
  }, {
    test: /\.(png|jpe?g|gif|woff|woff2|ttf|otf)$/,
    loader: 'url-loader?limit=10240&publicPath=' + (options.publicPath || './'),
  }, {
    test: /\.tsx?$/,
    loader: 'ts-loader',
    include: srcPath,
    options: {
      transpileOnly: true
    }
  }];
};
