'use strict';
/*global describe:true, it: true, afterEach: true */
var nodangel = require('../../lib/'),
    assert = require('assert'),
    path = require('path'),
    touch = require('touch'),
    utils = require('../utils'),
    appjs = path.resolve(__dirname, '..', 'fixtures', 'app.js'),
    envjs = path.resolve(__dirname, '..', 'fixtures', 'env.js');

describe('require-able', function () {
  var pwd = process.cwd(),
      oldhome = utils.home;

  afterEach(function () {
    process.chdir(pwd);
    utils.home = oldhome;
  });

  beforeEach(function (done) {
    // move to the fixtures directory to allow for config loading
    process.chdir(path.resolve(pwd, 'test'));
    utils.home = path.resolve(pwd, ['test'].join(path.sep));

    nodangel.reset(done);
  });

  it('should prioritise options over package.start', function (done) {
    process.chdir(path.resolve('fixtures/packages/start-ignored'));

    nodangel({
      script: envjs,
      env: { USER: 'nodangel' },
      stdout: false,
    }).on('stdout', function (data) {
      var out = data.toString().trim();
      assert(out === 'nodangel', 'expected output: ' + out);
      done();
    }).on('error', function (e) {
      assert(false, 'script did not run: ' + e);
      done();
    });
  });

  it('should know nodangel has been required', function () {
    assert(nodangel.config.required, 'nodangel has required property');
  });

  it('should restart on file change', function (done) {
    var restarted = false;

    utils.port++;
    nodangel({ script: appjs, verbose: true, env: { PORT: utils.port } }).on('start', function () {
      setTimeout(function () {
        touch.sync(appjs);
      }, 1000);
    }).on('restart', function () {
      restarted = true;
      nodangel.emit('quit');
    }).on('quit', function () {
      assert(restarted, 'nodangel restarted and quit properly');
      nodangel.reset(done);
    }).on('log', function (event) {
      // console.log(event.message);
    });
  });

  it('should be restartable', function (done) {
    var restarted = false;

    nodangel(appjs).on('start', function () {
      setTimeout(function () {
        nodangel.restart();
      }, 1000);
    }).on('restart', function () {
      restarted = true;
      nodangel.emit('quit');
    }).on('quit', function () {
      assert(restarted);
      nodangel.reset(done);
      // unbind events for testing again
    });
  });

  /*
  it('should restart a file with spaces', function (done) {
    var restarted = false;

    var found = false;
    utils.port++;
    setTimeout(function () {
      nodangel({
        exec: [path.resolve('fixtures', 'app\\ with\\ spaces.js'), 'foo'],
        verbose: true,
        stdout: false,
      }).on('log', function (e) {
        console.log(e.colour);
      }).on('start', function () {
        setTimeout(function () {
          console.log('touching ' + appjs);
          touch.sync(appjs);
        }, 5000);
      }).on('restart', function () {
        restarted = true;
        nodangel.emit('quit');
      }).on('quit', function () {
        assert(found, 'test for "foo" string in output');
        nodangel.reset(done);
      }).on('stdout', function (data) {
        console.log(data.toString().trim());
        found = data.toString().trim() === 'foo';
      });

    }, 2000);
  });
*/
});
