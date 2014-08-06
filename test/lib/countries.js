var assert = require('assert'),
    db = require('../../lib/db'),
    countries = require('../../lib/countries');

describe('countries', function() {
  before(function(done) {
    db.init(done);
  });

  describe('#list', function() {
    beforeEach(function() {
      countries.drop();
    });

    it('should return an empty list if there\'re no countries', function(done) {
      countries.list(function (err, countries) {
        assert.equal(err, undefined);
        assert.deepEqual(countries, []);
        done();
      });
    });

    it('should return the country name and its latest OBI score', function(done) {
      var data = {
        country: 'Brazil',
        obi_scores: [{ score: 39, year: 2013 }, { score: 42, year: 2014 }]
      };

      countries.insert(data, function (err) {
        assert.equal(err, undefined);
        countries.list(function (err, countries) {
          var expected = [{
            country: data.country,
            obi_score: data.obi_scores[1].score,
            obi_year: data.obi_scores[1].year,
          }];

          assert.equal(err, undefined);
          assert.deepEqual(countries, expected);
          done();
        });
      });
    });
  });

  describe('#insert', function() {
    beforeEach(function() {
      countries.drop();
    });

    it('should work', function(done) {
      var data = { country: 'Brazil' };

      countries.insert(data, function (err) {
        assert.equal(err, undefined);
        countries.list(function (err, countries) {
          assert.equal(err, undefined);
          assert.equal(countries.length, 1);
          assert.equal(countries[0].country, 'Brazil');
          done();
        });
      });
    });

    it('should not allow duplicates', function(done) {
      var data = { country: 'Brazil' };

      countries.insert(data, function (err) {
        assert.equal(err, undefined);
        countries.insert(data, function(err) {
          assert(/duplicate/.test(err.err));
          done();
        });
      });
    });
  });
});
