var assert = require('assert'),
    config = require('../../lib/config');

describe('config', function() {
  describe('#valid', function() {
    it('should be invalid with empty configuration', function() {
      assert.equal(config.valid({}), false);
    });

    it('should be valid when all configs are supplied', function() {
      assert.equal(config.valid({
          DB_PATH: 'x',
          COOKIE_SECRET: 'x',
          SESSION_SECRET: 'x'
      }), true);
    });
  });
});
