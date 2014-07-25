var assert = require('assert'),
    index = require('../index');

describe('index', function() {
  it('should export the app', function() {
    assert.notEqual(index.app, undefined);
  });
});
