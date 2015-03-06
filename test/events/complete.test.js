'use strict';
/*global describe:true, it: true, afterEach: true */
var nodangel = require('../../lib/'),
    assert = require('assert'),
    path = require('path'),
    touch = require('touch'),
    utils = require('../utils'),
    merge = require('../../lib/utils/merge'),
    dir = path.resolve(__dirname, '..', 'fixtures', 'events'),
    appjs = path.resolve(dir, 'env.js');

describe('events should follow normal flow on user triggered change', function () {
  function conf() {
    utils.port++;
    return {
      script: appjs,
      verbose: true,
      stdout: false,
      noReset: true,
      novm: true,
      ext: 'js',
      env: {
        PORT: utils.port,
        USER: 'nodangel',
      },
    };
  }

  var cwd = process.cwd();

  beforeEach(function (done) {
    nodangel.once('exit', function () {
      nodangel.reset(done);
    }).emit('quit');
  });

  before(function (done) {
    process.chdir(dir)
    nodangel.reset(done);
  });

  after(function (done) {
    process.chdir(cwd);
    nodangel.once('exit', function () {
      nodangel.reset(done);
    }).emit('quit');
  });

  it('start', function (done) {
    nodangel(conf()).once('start', function () {
      assert(true, '"start" event');
      done();
    });
  });

  it('config:update', function (done) {
    nodangel(conf()).on('config:update', function () {
      assert(true, '"config:update" event');
      done();
    });
  });

  it('exit', function (done) {
    var plan = new utils.Plan(4, function () {
      nodangel.reset(done);
    });
    var run = 0;

    nodangel(conf()).on('exit', function () {
      plan.assert(true, '"exit" event');
      if (run === 1) {
        setTimeout(function () {
          plan.assert(true, 'restarting ' + appjs);
          touch.sync(appjs);
        }, 1500);
      } else if (run === 2) {
        plan.assert(true, 'finished');
      } else {
        plan.assert(false, 'quit too many times: ' + run);
      }
    }).on('start', function () {
      run++;
    });
  })

  it('stdout', function (done) {
    nodangel(conf()).once('stdout', function (data) {
      assert(true, '"stdout" event with: ' + data);
      done();
    });
  });

  it('restart', function (done) {
    var plan = new utils.Plan(4, function () {
      nodangel.reset(done);
    });

    nodangel(conf()).on('restart', function (files) {
      plan.assert(true, '"restart" event with ' + files);
      plan.assert(files[0] === appjs, 'restart due to ' + files.join(' ') + ' changing');
    }).once('exit', function () {
      plan.assert(true, '"exit" event');
      setTimeout(function () {
        plan.assert(true, 'restarting');
        touch.sync(appjs);
      }, 1500);
    });
  });
});
