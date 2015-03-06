/*global describe:true, it: true */
var nodangel = require('../../lib/'),
    assert = require('assert');

describe('nodangel events', function () {
  it('should have (shims) events', function () {
    assert(nodangel.on);
  });

  it('should allow events to fire', function (done) {
    nodangel.on('foo', function () {
      assert(true);
      done();
    });

    nodangel.emit('foo');
  });
});


