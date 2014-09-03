var assert = require('assert'),
    async = require('async'),
    moment = require('moment'),
    db = require('../../lib/db'),
    countries = require('../../lib/countries'),
    users = require('../../lib/users');

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

    it('should return the country name, countryCode, and its latest OBI score as numbers', function(done) {
      var data = {
        country: 'Brazil',
        countryCode: 'BR',
        obi_scores: [{ score: '39', year: '2013' }, { score: '42', year: '2014' }]
      };

      countries.insert(data, function (err) {
        assert.ifError(err);
        countries.list(function (err, countries) {
          var expected = [{
            country: data.country,
            countryCode: data.countryCode,
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
      var data = { country: 'Brazil', countryCode: 'BR' };

      countries.insert(data, function (err) {
        assert.ifError(err);
        countries.get({ countryCode: 'BR' }, function (err, country) {
          assert.ifError(err);
          assert.equal(country.country, data.country);
          assert.equal(country.countryCode, data.countryCode);
          done();
        });
      });
    });

    it('should return null if couldn\'t find countryCode', function(done) {
      countries.get({ countryCode: 'inexistent-countryCode' }, function (err, country) {
        assert.ifError(err);
        assert.equal(country, null);
        done();
      });
    });

    it('should include the sites', function(done) {
      var country = { country: 'Brazil', countryCode: 'BR' },
          user = {
            username: 'username',
            password: 'password',
            user: {
              country: country.countryCode + ' - ' + country.country,
              admin: false,
              sites: [{
                active: true,
                title: 'the title',
                type: 'Audit Report',
                search_dates: {
                  start: moment('2014-01-01').toString(),
                  end: moment('2014-06-01').toString(),
                }
              }],
            },
          };

      var expectedCountry = {
        country: country.country,
        sites: [{
          title: user.user.sites[0].title,
          type: user.user.sites[0].type,
          search_dates: user.user.sites[0].search_dates,
        }],
      };

      async.parallel({
        country: function(callback) {
          countries.insert(country, callback);
        },
        user: function(callback) {
          users.drop();
          users.insert(user, callback);
        },
      }, function(err, results) {
        assert.ifError(err);
        countries.get({ countryCode: country.countryCode }, function (err, country) {
          assert.ifError(err);
          assert.equal(country.country, expectedCountry.country);
          assert.deepEqual(country.sites, expectedCountry.sites);
          users.drop();
          done();
        });
      });
    });

    it('should include the sorted obi_scores', function(done) {
      var country = {
        country: 'Brazil',
        countryCode: 'BR',
        obi_scores: [
          { year: "2014", score: 42 },
          { year: "2012", score: 30 },
          { year: "2013", score: 31 },
        ]
      };

      var expectedCountry = {
        country: country.country,
        obi_scores: [
          { year: "2012", score: 30 },
          { year: "2013", score: 31 },
          { year: "2014", score: 42 },
        ],
      };

      async.parallel({
        country: function(callback) {
          countries.insert(country, callback);
        },
      }, function(err, results) {
        assert.ifError(err);
        countries.get({ countryCode: country.countryCode }, function (err, country) {
          assert.ifError(err);
          assert.equal(country.country, expectedCountry.country);
          assert.deepEqual(country.obi_scores, expectedCountry.obi_scores);
          done();
        });
      });
    });
  });
});
