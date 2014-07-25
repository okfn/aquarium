var assert = require('assert'),
    config = require('../../lib/config'),
    db = require('../../lib/db'),
    sinon = require('sinon');

describe('db', function() {
  describe('#init', function() {
    it('should succeed when run with the configured mongo', function(done) {
      db.init(function(err) {
          assert.equal(err, undefined);
          db.close();
          done();
      });
    });

    it('should fail if its invalid', function(done) {
      sinon.stub(config, 'valid').returns(false);

      db.init(function(err) {
          assert.equal(err, "Set valid DB variables in the .env file.");
          config.valid.restore();
          done();
      });
    });
  });
});
