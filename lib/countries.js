var _ = require('underscore'),
    moment = require('moment'),
    async = require('async'),
    db = require('./db');

module.exports = {
    /**
     * Returns all countries in the collection with the last score/year combo
     *
     * @param {Function} callback
     *
     */
    list: function(callback) {
      var countries = db.coll('countries'),
          sites = require('./sites'),
          documents = require('./documents');

      async.waterfall([
        // get countries
        function(callback) {
          countries.find({
            $orderby: {
              country: 1,
            },
            $query: {}
          }, function(err, cursor) {
            if (err) {
              return callback(err);
            }
            cursor.toArray(function(err, countries) {
              if (err || !countries) {
                return callback(err || {}, countries);
              }
              _.each(countries, cleanCountry);
              callback(err, countries);
            });
          });
        },
      ], function(err, countries) {
        var now = moment();
        if (err || !countries) {
          return callback(null, countries);
        }

        callback(err, countries);
      });
    },
    insert: function(data, callback) {
      var countries = db.coll('countries');

      countries.insert(data, callback);
    },
    drop: function() {
      var countries = db.coll('countries');

      countries.drop();
    },
    createIndexes: function(callback) {
      var countries = db.coll('countries');

      countries.ensureIndex('country', { unique: true, dropDups: true }, callback);
    },
    get: function(options, callback) {
      var countries = db.coll('countries'),
          sites = require('./sites'),
          documents = require('./documents');

      async.waterfall([
        // get countries
        function(callback) {
          countries.findOne(options, function(err, country) {
            if (err || !country) {
              return callback(err || {}, country);
            }
            callback(err, cleanCountry(country));
          });
        },
        // get sites
        function(country, callback) {
          var query = {
            country: country.country_code + ' - ' + country.country,
            admin: false,
          };
          sites.listAll(query, function(err, sites) {
            if (err || !sites) {
              return callback(err || {}, country);
            }
            country.sites = sites;
            callback(err, country);
          });
        },
        // get documents
        function (country, callback) {
          var query = {
            country: country.country,
            country_code: country.country_code,
          };

          documents.listAll(query, function(err, docs) {
            if (err || !docs) {
              return callback(err || {}, country);
            }
            country.documents = docs;
            callback(err, country);
          });
        }
      ], function(err, country) {
        var now = moment();
        if (err || !country) {
          return callback(null, country);
        }

        country.sites = _.map(country.sites, function(site) {
          var theSite = {
            title: site.title,
            type: site.type,
            search_dates: site.search_dates
          };
          if (site.url) {
            theSite.url = site.url;
          }
          return theSite;
        });

        country.documents = _.map(country.documents, function(doc) {
          var theDoc = {
                state: documents.getDocumentState(doc),
              },
              attributes = [
                'year', 'title', 'type', 'approved',
                'expected_date_published', 'date_published', 'date_received'
              ];
          _.each(attributes, function(attribute) {
            if (doc[attribute]) {
              theDoc[attribute] = doc[attribute];
            }
          });
          return theDoc;
        });
        // Turn array of documents into structure like:
        // { 2013: { "In-Year Report": [ ... ], ... }, ... }
        country.documents = _.groupBy(country.documents, 'year');
        _.each(country.documents, function(doc, year) {
          _.each(country.documents[year], function (doc) {
            delete doc.year;
          });
          country.documents[year] = _.groupBy(country.documents[year], 'type');
        });

        callback(err, country);
      });
    },
};

function cleanCountry(country) {
  if (!country) {
    return country;
  }
  delete country._id;
  if (country.obi_scores) {
    country.obi_scores = _.sortBy(country.obi_scores, 'year');
    country.obi_scores = _.map(country.obi_scores, function (obi_score) {
      if (obi_score.year) {
        obi_score.year = Number(obi_score.year);
      }
      return obi_score;
    });
  }
  return country;
}
