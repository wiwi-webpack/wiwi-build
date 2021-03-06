'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var mkdirp = require('mkdirp');
var chalk = require('chalk');
var webpack = require('webpack');


var util = {
    // get absolute path to cwd
    cwdPath: function() {
        var argvs = Array.prototype.slice.call(arguments);
        argvs.unshift(process.cwd());
        return path.join.apply(path, argvs);
    },

    // get absolute path to __dirname
    relPath: function(p) {
        var argvs = Array.prototype.slice.call(arguments);
        argvs.unshift(__dirname);
        return path.join.apply(path, argvs);
    },

    // make a webpack entry
    makeEntry: function() {
        return './' + path.join.apply(path, arguments);
    },

    // make all valid pages as webpack entries
    makePageEntries: function(src, entries, pagesFilter) {
        var pages = fs.readdirSync(path.join(src, 'pages'));
        if (typeof pagesFilter === 'string') {
            pagesFilter = pagesFilter.split(',');
            pages = pages.filter(function(page) {
                return pagesFilter.indexOf(page) !== -1;
            });
        }
        pages.forEach(function(page) {
            try {
                var entry = path.join(src, 'pages', page, 'index.js');
                if (fs.statSync(entry).isFile()) {
                entries[page] = util.makeEntry(src, 'pages', page, 'index.js');
                return;
                }
            } catch (e) {
            }
            try {
                var entry = path.join(src, 'pages', page, 'index.jsx');
                if (fs.statSync(entry).isFile()) {
                entries[page] = util.makeEntry(src, 'pages', page, 'index.jsx');
                }
            } catch (e) {
            }
        });
        return entries;
    },

    // make babel plugin/preset absolute path
    babel: function(type, name) {
        if (Array.isArray(name)) {
        return name.map(function(n) {
            return util.babel(type, n);
        });
        } else {
        if (typeof name === 'object') {
            return [
            require.resolve([
                'babel',
                type,
                name.name
            ].join('-')),
            name.options
            ];
        } else {
            return require.resolve([
            'babel',
            type,
            name
            ].join('-'));
        }
        }
    },
    
    // copy files to dir
    copy: function(srcPattern, targetDir) {

        if (Array.isArray(srcPattern)) {

        // multi-glob-patterns
        srcPattern.forEach(function(src) {
            util.copy(src, targetDir);
        });

        } else {

        // single-glob-pattern
        var baseDir = srcPattern.split('**')[0];
        glob.sync(srcPattern, {
            nodir: true
        }).forEach(function(file) {

            // read from source and write to dist
            console.log('Copy file: ' + file);
            var target = path.join(targetDir, path.relative(baseDir, file));
            mkdirp.sync(path.dirname(target));
            fs.writeFileSync(target, fs.readFileSync(file));
        });
        }
    },
    // merge vars to buildvars
    parseBuildVars: function(vars, buildvars) {
        var key, newVars = {};
        for (key in vars) {
            newVars[key] = [ vars[key] ];
        }
        for (key in buildvars) {
            newVars[key] = buildvars[key];
        }
        return newVars;
    },

    // compiler pre-process
    preProcess: function(config) {
        var newConfig;
        try {
            var webpackCfg = require(util.cwdPath('webpack.config.js'));
            newConfig = typeof webpackCfg === 'function' ? webpackCfg(config, webpack) : webpackCfg;
        } catch (e) {
            if (!/Cannot find module.+webpack\.config\.js/.test(e.toString())) {
                console.error(chalk.red('Error in "webpack.config.js"\n' + e.stack));
                process.exit(1);
            }
        }
        return newConfig || config;
    },

    // webpack build failed
    buildFail: function(msg) {
        console.error(chalk.red('\n' + chalk.bold('Webpack Build Failed.') + '\n' + msg));
        process.exit(1);
    },

    // log after finish
    finishLog: function(startStamp) {
        console.log(chalk.green.bold('Finished in ' + ((Date.now() - startStamp) / 1000).toFixed(2) + 's'));
    },
};

module.exports = util;