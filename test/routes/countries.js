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

            assert.equal(res.body.length, 1);
            assert.equal(res.body[0].country, data.country);
            countries.drop();
          })
          .expect(200, done);
      });
    });
  });

  describe('country', function() {
    it('should return 404 on inexistent country_code', function(done) {
      request(app)
        .get('/country/inexistent-country_code')
        .expect(404, done);
    });

    it('should return the country', function(done) {
      var data = { country: 'Brazil', country_code: 'BR' };
      countries.drop();
      countries.insert(data, function(err) {
        assert.ifError(err);
        request(app)
          .get('/country/' + data.country_code)
          .expect(function (res) {
            var country = res.body;
            assert.equal(country.country, data.country);
            assert.equal(country.country_code, data.country_code);
            countries.drop();
          })
          .expect(200, done);
      });
    });
  });
});
