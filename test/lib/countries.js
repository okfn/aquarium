var assert = require('assert'),
    async = require('async'),
    moment = require('moment'),
    _ = require('underscore'),
    db = require('../../lib/db'),
    countries = require('../../lib/countries'),
    users = require('../../lib/users'),
    documents = require('../../lib/documents');

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

    it('should include the sorted obi_scores, with year as number', function(done) {
      var brazil = {
        country: 'Brazil',
        country_code: 'BR',
        obi_scores: [
          { year: '2014', score: 42 },
          { year: '2012', score: 30 },
        ]
      };
      var argentina = {
        country: 'Argentina',
        country_code: 'AR',
        obi_scores: [
          { year: '2012', score: 30 },
          { year: '2013', score: 31 },
        ]
      };

      var expectedObiScores = {
        Argentina: _.clone(argentina.obi_scores),
        Brazil: _.clone(brazil.obi_scores),
      };

      async.parallel({
        brazil: function(callback) {
          countries.insert(brazil, callback);
        },
        argentina: function(callback) {
          countries.insert(argentina, callback);
        },
      }, function(err, results) {
        assert.ifError(err);
        countries.list(function(err, countries) {
          assert.ifError(err);
          _.each(countries, function(country) {
            var obiScores = expectedObiScores[country.country];
            obiScores = _.sortBy(obiScores, 'year');
            assert.deepEqual(country.obi_scores, obiScores);
          });
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
      var data = { country: 'Brazil', country_code: 'BR' };

      countries.insert(data, function (err) {
        assert.ifError(err);
        countries.get({ country_code: 'BR' }, function (err, country) {
          assert.ifError(err);
          assert.equal(country.country, data.country);
          assert.equal(country.country_code, data.country_code);
          done();
        });
      });
    });

    it('should return null if couldn\'t find country_code', function(done) {
      countries.get({ country_code: 'inexistent-country_code' }, function (err, country) {
        assert.ifError(err);
        assert.equal(country, null);
        done();
      });
    });

    it('should include the active sites', function(done) {
      var country = { country: 'Brazil', country_code: 'BR' },
          user = {
            username: 'username',
            password: 'password',
            user: {
              country: country.country_code + ' - ' + country.country,
              admin: false,
              sites: [{
                active: true,
                title: 'active site',
                type: 'Audit Report',
                search_dates: {
                  start: moment('2014-01-01').toString(),
                  end: moment('2014-06-01').toString(),
                }
              },
              {
                active: false,
                title: 'inactive site',
                type: 'In-Year Report',
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
        countries.get({ country_code: country.country_code }, function (err, country) {
          assert.ifError(err);
          assert.equal(country.country, expectedCountry.country);
          assert.deepEqual(country.sites, expectedCountry.sites);
          users.drop();
          done();
        });
      });
    });

    it('should include the sorted obi_scores, with year as number', function(done) {
      var country = {
        country: 'Brazil',
        country_code: 'BR',
        obi_scores: [
          { year: '2014', score: 42 },
          { year: '2012', score: 30 },
          { year: '2013', score: 31 },
        ]
      };

      var expectedCountry = {
        country: country.country,
        obi_scores: [
          { year: 2012, score: 30 },
          { year: 2013, score: 31 },
          { year: 2014, score: 42 },
        ],
      };

      async.parallel({
        country: function(callback) {
          countries.insert(country, callback);
        },
      }, function(err, results) {
        assert.ifError(err);
        countries.get({ country_code: country.country_code }, function (err, country) {
          assert.ifError(err);
          assert.equal(country.country, expectedCountry.country);
          assert.deepEqual(country.obi_scores, expectedCountry.obi_scores);
          done();
        });
      });
    });

    it('should include the documents', function(done) {
      var country, doc1, doc2,
          expectedCountry, expectedDoc1, expectedDoc2;

      country = {
        country: 'Brazil',
        country_code: 'BR',
      };
      doc1 = {
        country: country.country,
        country_code: country.country_code,
        year: 2014,
        title: 'The Title',
        type: 'In-Year Report',
        approved: true,
        expected_date_published: moment('01-01-2014'),
        date_published: moment('01-02-2014'),
        date_received: moment('01-03-2014'),
      };
      doc2 = {
        country: country.country,
        country_code: country.country_code,
        year: 2013,
        title: 'The Title',
        type: 'Citizen\'s Budget',
        approved: true,
      };

      expectedDoc1 = _.clone(doc1);
      expectedDoc1.state = documents.getDocumentState(expectedDoc1);
      expectedDoc2 = _.clone(doc2);
      expectedDoc2.state = documents.getDocumentState(expectedDoc2);

      // This fixes the assert.deepEqual. For some reason, the documents
      // received have _f and _l == null, and these expected docs have it ==
      // undefined.
      expectedDoc1.expected_date_published._f = expectedDoc1.expected_date_published._l = null;
      expectedDoc1.date_published._f = expectedDoc1.date_published._l = null;
      expectedDoc1.date_received._f = expectedDoc1.date_received._l = null;
      delete expectedDoc1.country;
      delete expectedDoc1.country_code;
      delete expectedDoc1.year;
      delete expectedDoc2.country;
      delete expectedDoc2.country_code;
      delete expectedDoc2.year;

      expectedCountry = {
        country: country.country,
        documents: {
          "2014": {
            "In-Year Report": [
              expectedDoc1,
            ]
          },
          "2013": {
            "Citizen's Budget": [
              expectedDoc2,
            ]
          }
        }
      };

      documents.drop();
      async.parallel({
        country: function(callback) {
          countries.insert(country, callback);
        },
        doc1: function(callback) {
          documents.insert({ data: doc1 }, callback);
        },
        doc2: function(callback) {
          documents.insert({ data: doc2 }, callback);
        },
      }, function(err, results) {
        assert.ifError(err);
        countries.get({ country_code: country.country_code }, function (err, country) {
          assert.ifError(err);
          assert.equal(country.country, expectedCountry.country);
          assert.deepEqual(country.documents, expectedCountry.documents);
          documents.drop();
          done();
        });
      });
    });
  });
});
