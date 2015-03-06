'use strict';
/*global describe:true, it: true */
var assert = require('assert'),
    match = require('../../lib/monitor/match'),
    config = require('../../lib/config'),
    path = require('path'),
    fs = require('fs'),
    nodangelUtils = require('../../lib/utils'),
    defaults = require('../../lib/config/defaults'),
    utils = require('../utils'),
    merge = nodangelUtils.merge;

describe('match', function () {
  var monitor = [
    '!.git',
    '!node_modules/*',
    '!public/*',
    '!npm-debug.log',
    '!node_modules/*',
    'views/server/*',
    '!*.coffee',
  ];

  it('should match zero files', function () {
    var files = [
      'views/server/remy.coffee',
      'random.coffee',
      '/User/remy/app/server/foo.coffee'
    ];

    var results = match(files, monitor); // ignoring extension support
    assert(results.result.length === 0, 'matched ' + results.result.length);
  });

  it('should match one file', function () {
    var files = [
      'views/server/remy.js',
      'random.coffee',
      '/User/remy/app/server/foo.coffee'
    ];

    var results = match(files, monitor);
    assert(results.result.length === 1, 'matched ' + results.result.length);
  });

  it('should match two files', function () {
    var files = [
      'views/server/test.js',
      'views/server/test2.js',
      'views/server/test.coffee'
    ];

    var results = match(files, monitor);
    assert(results.result.length === 2, 'matched ' + results.result.length);
  });

  it('should match one file', function () {
    var files = [
      'views/server/remy.js',
      'views/server/ignore.js',
      'random.coffee',
      '/User/remy/app/server/foo.coffee'
    ];
    monitor.push('!views/server/ignore.js');

    var results = match(files, monitor);
    assert(results.result.length === 1, 'matched ' + results.result.length);
  });

  it('should apply *.js to any js file', function () {
    var files = [utils.appjs];

    var result = match(files, ['*.*'], 'js');

    assert.deepEqual(result.result, files, 'file returned from match, matches');
    assert(result.ignored === 0, 'no files were ignored');
    assert(result.watched === files.length, 'a single file was matched');
  });

  it('should ignore .coffee if watching *.js', function () {
    var files = [utils.appcoffee];

    var result = match(files, ['*.*'], 'js');

    assert.deepEqual(result.result, [], 'no results returned: ' + result.result);
  });

  it('should match .coffee if watching *.js & *.coffee', function (done) {
    config.load({
      ext: 'js coffee'
    }, function (config) {
      var files = [utils.appcoffee];

      var result = match(files, config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, files, 'coffee file matched');
      assert(result.ignored === 0, '0 files ignored');
      done();
    });
  });

  it('should ignore nodangel default rules', function (done) {
    config.load({ ext: '*.js' }, function (config) {

      var files = [utils.appjs, path.join(__dirname, '/.git/foo.js')];

      var result = match(files, config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, files.slice(0, 1), 'first file matched');
      assert(result.ignored === 1, '.git file was ignored');
      assert(result.watched === 1, 'a single file was matched');

      done();
    });

  });

  it('should ignore directories', function (done) {
    config.load({
      ext: 'js',
      ignore: 'test/fixtures'
    }, function (config) {
      var files = [utils.appjs];

      var result = match(files, config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, [], 'should be no files matched');
      done();
    });
  });

  it('should check all directories by default', function (done) {
    config.load({
      ext: 'js'
    }, function (config) {
      var files = [utils.appjs];
      var result = match(files, config.options.monitor, config.options.execOptions.ext);
      assert.deepEqual(result.result, files, 'results should match');
      done();
    });
  });

  it('should support old .nodangelignore', function (done) {
    // prevents our test from finding the nodangel.json files
    var pwd = process.cwd(),
        old = nodangelUtils.home;

    process.chdir(path.resolve(pwd, 'test/fixtures/legacy'));
    nodangelUtils.home = path.resolve(pwd, 'test/fixtures/legacy');

    // will load the legacy file format
    config.load({ script: utils.appjs, ext: 'js json' }, function (config) {
      var files = [utils.appjs];
      var result = match(files, config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, files, 'allows app.js: ' + result.result);

      files = [path.resolve(pwd, 'test/fixtures/app.json')];
      result = match(files, config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, [], 'nothing matched' + result.result);

      process.chdir(pwd);
      nodangelUtils.home = old;
      done();
    });
  });

  it('should be specific about directories', function (done) {
    config.load({
      ext: 'js md jade',
      watch: ['lib']
    }, function (config) {
      var files = [utils.appjs];
      var result = match(files, config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, [], 'no results');
      done();
    });
  });

  it('should not match coffee when monitoring just js', function (done) {
    config.load({
      script: utils.appjs
    }, function (config) {
      var result = match([utils.appcoffee], config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, [], 'no results');
      done();
    });
  });

  it('should ignore case when comparing paths on Windows', function () {
    if (!nodangelUtils.isWindows) {
      return;
    }
    var results = match(['C:\\TEST\\fixtures'], ['c:\\test\\fixtures']);
    assert(results.result.length === 1, 'matched ' + results.result.length);
  });
});

describe('validating files that cause restart', function () {
  it('should allow for relative paths outside of the cwd', function () {
    var cwd = process.cwd();
    var dir = cwd + '/test/fixtures/configs';
    process.chdir(dir);
    var filename = './watch-relative.json';
    var config = JSON.parse(fs.readFileSync(filename));
    var settings = merge(config, defaults);
    var script = path.resolve('../../../lib/__init__.py');

    settings.monitor = match.rulesToMonitor(settings.watch, settings.ignore, { dirs: [], system: { useFind: true } });

    var matched = match([script], settings.monitor, settings.ext.replace(' ', ','));
    process.chdir(cwd);

    assert(matched.result.length === 1, 'relative file matched: ' + matched.results);
  });

  it('should allow *.js to match at the top level', function () {
    var filename = path.join('test', 'fixtures', 'configs', 'top-level.json');
    var config = JSON.parse(fs.readFileSync(filename));
    var settings = merge(config, defaults);
    var script = path.resolve('app.js');

    settings.monitor = match.rulesToMonitor(settings.watch, settings.ignore, { dirs: [], system: { useFind: true } });

    var matched = match([script], settings.monitor, settings.ext.replace(' ', ','));
    assert(matched.result.length === 1, 'found match ' + matched.results);
  });

  it('should allow for simple star rule: public/*', function () {
    var filename = path.join('test', 'fixtures', 'configs', 'public-star.json');
    var config = JSON.parse(fs.readFileSync(filename));
    var settings = merge(config, defaults);
    var script = 'public/js/chrome.save.js';

    settings.monitor = match.rulesToMonitor(settings.watch, settings.ignore, { dirs: [], system: { useFind: true } });

    var matched = match([script], settings.monitor, settings.ext.replace(' ', ','));
    assert(matched.result.length === 0, 'public/* ignored: ' + matched.results);
  });

  it('should allow for relative paths with extensions', function () {
    var cwd = process.cwd();
    var dir = cwd + '/test/fixtures/configs';
    process.chdir(dir);
    var filename = './watch-relative-filter.json';
    var config = JSON.parse(fs.readFileSync(filename));
    var settings = merge(config, defaults);
    var script = path.resolve('../jsbin/scripts.json');

    settings.monitor = match.rulesToMonitor(settings.watch, settings.ignore, { dirs: [], system: { useFind: true } });

    var matched = match([script], settings.monitor, settings.ext.replace(' ', ','));
    process.chdir(cwd);

    assert(matched.result.length === 1, 'relative file matched: ' + matched.results);
  });

});

describe('match rule parser', function () {
  it('should support "--watch ."', function () {
    var config = { watch: '.' };
    var settings = merge(config, defaults);
    var script = 'index.js';

    settings.monitor = match.rulesToMonitor(settings.watch, [], { dirs: [], system: { useFind: true } });

    assert(settings.monitor[0] === '*.*', 'path resolved: ' + settings.monitor[0]);
    var matched = match([script], settings.monitor, 'js');
    assert(matched.result.length === 1, 'no file matched');
  });


  it('should support "--watch .*"', function () {
    var config = { watch: '.*' };
    var settings = merge(config, defaults);
    var script = 'index.js';

    settings.monitor = match.rulesToMonitor(settings.watch, [], { dirs: [], system: { useFind: true } });

    assert(settings.monitor[0] === '*.*', 'path resolved: ' + settings.monitor[0]);
    var matched = match([script], settings.monitor, 'js');
    assert(matched.result.length === 1, 'no file matched');
  });


  it('should support "--watch <single file>"', function () {
    var config = { watch: 'config.json' };
    var settings = merge(config, defaults);

    settings.monitor = match.rulesToMonitor(settings.watch, [], { dirs: [], system: { useFind: true } });

    var matched = match(['/some/path/to/config.json'], settings.monitor, 'js');
    assert(matched.result.length === 1, 'no file matched');
  });

  it('should support "--watch /some/path/*/config.json"', function () {
    var config = { watch: '/*/config.json' };
    var settings = merge(config, defaults);

    settings.monitor = match.rulesToMonitor(settings.watch, [], { dirs: [], system: { useFind: true } });

    var matched = match(['/some/path/to/config.json'], settings.monitor, 'js');
    assert(matched.result.length === 1, 'no file matched');
  });


  it('should support "--watch *.*"', function () {
    var config = { watch: '*.*' };
    var settings = merge(config, defaults);
    var script = 'index.js';

    settings.monitor = match.rulesToMonitor(settings.watch, [], { dirs: [], system: { useFind: true } });

    assert(settings.monitor[0] === '*.*', 'path resolved: ' + settings.monitor[0]);
    var matched = match([script], settings.monitor, 'js');
    assert(matched.result.length === 1, 'no file matched');
  });

  it('should support "--watch .."', function () {
    // make sure we're in a deep enough directory
    var cwd = process.cwd();
    process.chdir('./test/fixtures/');
    var pwd = process.cwd();
    var config = { watch: '..' };
    var settings = merge(config, defaults);
    var script = pwd + 'index.js';

    settings.monitor = match.rulesToMonitor(settings.watch, [], { dirs: [], system: { useFind: true } });

    process.chdir(cwd);

    assert(settings.monitor[0] === path.resolve(pwd, '..') + '/**/*', 'path resolved: ' + settings.monitor[0]);
    var matched = match([script], settings.monitor, 'js');
    assert(matched.result.length === 1, 'no file matched');
  });
});
