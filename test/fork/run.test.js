/*global describe:true, it: true */
var assert = require('assert'),
    utils = require('../utils'),
    appjs = utils.appjs,
    run = utils.run;

describe('nodangel fork', function () {
  it('should start a fork', function (done) {
    var p = run(appjs, {
      error: function (data) {
        p.send('quit');
        done(new Error(data));
      }
    });

    p.on('message', function (event) {
      if (event.type === 'start') {
        p.send('quit');
        assert(true, 'nodangel started');
        done();
      }
    });
  });

  it('should start a fork exec with a space without args', function (done) {
    var found = false;
    var p = run({
      exec: 'bin/nodangel.js',
      // make nodangel verbose so we can check the filters being applied
      args: ['-q', '--exec', 'test/fixtures/app\\ with\\ spaces.js']
    }, {
      error: function (data) {
        p.send('quit');
        done(new Error(data));
      },
      output: function (data) {
        // process.stdout.write(data);
        if (data.trim() === 'OK') {
          found = true;
        }
      }
    });

    p.on('message', function (event) {
      if (event.type === 'start') {
        setTimeout(function () {
          p.send('quit');
          done();
          assert(found, '"OK" message was found');
        }, 500);
      }
    });
  });

it('should start a fork exec with quotes and escaping', function (done) {
    var found = false;
    var p = run({
      exec: 'bin/nodangel.js',
      // make nodangel verbose so we can check the filters being applied
      args: ['-q', '--exec', 'test/fixtures/some\\\"file']
    }, {
      error: function (data) {
        p.send('quit');
        done(new Error(data));
      },
      output: function (data) {
        // process.stdout.write(data);
        if (data.trim() === 'OK') {
          found = true;
        }
      }
    });

    p.on('message', function (event) {
      if (event.type === 'start') {
        setTimeout(function () {
          p.send('quit');
          done();
          assert(found, '"OK" message was found');
        }, 500);
      }
    });
  });

it('should start a fork exec with spaces and slashes', function (done) {
    var found = false;
    var p = run({
      exec: 'bin/nodangel.js',
      // make nodangel verbose so we can check the filters being applied
      args: ['-q', '--exec', '"test/fixtures/some\ \\file"']
    }, {
      error: function (data) {
        p.send('quit');
        done(new Error(data));
      },
      output: function (data) {
        // process.stdout.write(data);
        if (data.trim() === 'OK') {
          found = true;
        }
      }
    });

    p.on('message', function (event) {
      if (event.type === 'start') {
        setTimeout(function () {
          p.send('quit');
          done();
          assert(found, '"OK" message was found');
        }, 500);
      }
    });
  });

  it('should start a fork exec with a space with args', function (done) {
    var found = false;
    var p = run({
      exec: 'bin/nodangel.js',
      // make nodangel verbose so we can check the filters being applied
      args: ['-q', '--exec', '"test/fixtures/app with spaces.js" foo'],
    }, {
      error: function (data) {
        p.send('quit');
        done(new Error(data));
      },
      output: function (data) {
        if (data.trim() === 'foo') {
          found = true;
        }
      }
    });

    p.on('message', function (event) {
      if (event.type === 'start') {
        setTimeout(function () {
          p.send('quit');
          assert(found, '"foo" message found');
          done();
        }, 500);
      }
    });
  });

    it('should start a fork exec with a space with args (escaped)', function (done) {
    var found = false;
    var p = run({
      exec: 'bin/nodangel.js',
      // make nodangel verbose so we can check the filters being applied
      args: ['-q', '--exec', 'test/fixtures/app\\ with\\ spaces.js foo']
    }, {
      error: function (data) {
        p.send('quit');
        done(new Error(data));
      },
      output: function (data) {
        // process.stdout.write(data);
        if (data.trim() === 'foo') {
          found = true;
        }
      }
    });

    p.on('message', function (event) {
      if (event.type === 'start') {
        setTimeout(function () {
          p.send('quit');
          done();
          assert(found, '"OK" message found');
        }, 500);
      }
    });
  });
});
