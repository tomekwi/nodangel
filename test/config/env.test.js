'use strict';
/*global describe:true, it: true, after: true */
var nodangel = require('../../lib/'),
    path = require('path'),
    assert = require('assert');

describe('when nodangel runs (1)', function () {
  var tmp = path.resolve('test/fixtures/env.js');
  after(function (done) {
    // clean up just in case.
    nodangel.once('exit', function () {
      nodangel.reset();
      done();
    }).emit('quit');
  });

  it('should pass through environment values', function (done) {
    nodangel({ script: tmp, stdout: false, env: { USER: 'nodangel' } }).on('stdout', function (data) {
      assert(data.toString().trim() === 'nodangel', 'USER env value correctly set to "nodangel": ' + data.toString());
      nodangel.once('exit', function () {
        nodangel.reset();
        done();
      }).emit('quit');
    });
  });
});
