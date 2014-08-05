var assert = require('assert'),
    config = require('../lib/config'),
    original_DB_PATH = config.DB_PATH,
    TEST_DB_PATH = original_DB_PATH + '_test';

before(function() {
  config.DB_PATH = TEST_DB_PATH;
});

after(function() {
  config.DB_PATH = original_DB_PATH;
});

describe('index', function() {
  var index = require('../index');

  it('should export the app', function() {
    assert.notEqual(index.app, undefined);
  });
});
