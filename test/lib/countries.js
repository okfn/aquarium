var assert = require('assert'),
    db = require('../../lib/db'),
    countries = require('../../lib/countries');

describe('countries', function() {
  before(function(done) {
    db.init(done);
  });

  beforeEach(function() {
    countries.drop();
  });

  describe('#list', function() {
    it('should return an empty list if there\'re no countries', function(done) {
      countries.list(function (err, countries) {
        assert.ifError(err);
        assert.deepEqual(countries, []);
        done();
      });
    });

    it('should return the country name, code, and its latest OBI score as numbers', function(done) {
      var data = {
        country: 'Brazil',
        code: 'BR',
        obi_scores: [{ score: '39', year: '2013' }, { score: '42', year: '2014' }]
      };

      countries.insert(data, function (err) {
        assert.ifError(err);
        countries.list(function (err, countries) {
          var expected = [{
            country: data.country,
            code: data.code,
            obi_score: Number(data.obi_scores[1].score),
            obi_year: Number(data.obi_scores[1].year),
          }];

          assert.ifError(err);
          assert.deepEqual(countries, expected);
          assert.strictEqual(countries[0].obi_score, expected[0].obi_score);
          assert.strictEqual(countries[0].obi_year, expected[0].obi_year);
          done();
        });
      });
    });
  });

  describe('#insert', function() {
    it('should work', function(done) {
      var data = { country: 'Brazil' };

      countries.insert(data, function (err) {
        assert.ifError(err);
        countries.list(function (err, countries) {
          assert.ifError(err);
          assert.equal(countries.length, 1);
          assert.equal(countries[0].country, 'Brazil');
          done();
        });
      });
    });

    it('should not allow duplicates', function(done) {
      var data = { country: 'Brazil' };

      countries.insert(data, function (err) {
        assert.ifError(err);
        countries.insert(data, function(err) {
          assert(/duplicate/.test(err.err));
          done();
        });
      });
    });
  });

  describe('#get', function() {
    it('should work', function(done) {
      var data = { country: 'Brazil', code: 'BR' };

      countries.insert(data, function (err) {
        assert.ifError(err);
        countries.get({ code: 'BR' }, function (err, country) {
          assert.ifError(err);
          assert.deepEqual(country, data);
          done();
        });
      });
    });
  });
});
