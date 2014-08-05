var assert = require('assert'),
    request = require('supertest'),
    overview = require('../../lib/overview'),
    index = require('../../index');

describe('overview', function() {
  var app;

  before(function(done) {
    index.init(function() {
      app = index.app;
      done();
    });
  });

  describe('overview', function() {
    it('should exist', function(done) {
      request(app)
        .get('/overview')
        .expect(200, done);
    });

    it('should return a html by default', function(done) {
      request(app)
        .get('/overview')
        .expect('Content-Type', /html/)
        .expect(200, done);
    });

    it('should return a json when the accept headers are set properly', function(done) {
      request(app)
        .get('/overview')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('should return a json when the route ends with .json', function(done) {
      request(app)
        .get('/overview.JSon')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
  });
});
