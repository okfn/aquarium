var assert = require('assert'),
    request = require('supertest'),
    countries = require('../../lib/countries'),
    index = require('../../index');

describe('routes', function() {
  var app;

  before(function(done) {
    index.init(function() {
      app = index.app;
      done();
    });
  });

  describe('countries', function() {
    it('should exist', function(done) {
      request(app)
        .get('/countries')
        .expect(200, done);
    });

    it('should return a json', function(done) {
      request(app)
        .get('/countries')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('should return the countries', function(done) {
      var data = { country: 'Brazil' };
      countries.drop();
      countries.insert(data, function(err) {
        assert.ifError(err);
        request(app)
          .get('/countries')
          .set('Accept', 'application/json')
          .expect(function (res) {
            var expectedResult = [{ country: data.country }];

            assert.deepEqual(res.body, expectedResult);
            countries.drop();
          })
          .expect(200, done);
      });
    });
  });
});
