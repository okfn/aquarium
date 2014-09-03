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
        var countries = db.coll('countries');

        countries.find({
            $orderby: {
                country: 1
            },
            $query: {}
        }, function(err, cursor) {
            if (err) {
                return callback(err);
            }
            cursor.toArray(function(err, countries) {
                callback(null, _.map(countries, function(country) {
                    var score = _.last(_.sortBy(country.obi_scores, 'year'));

                    return {
                        country: country.country,
                        country_code: country.country_code,
                        obi_score: score && Number(score.score),
                        obi_year: score && Number(score.year)
                    };
                }));
            });
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
          sites = require('./sites');

      async.parallel({
        country: function(callback) {
          countries.findOne(options, function(err, country) {
            if (err || !country) {
              return callback(err, country);
            }
            delete country._id;
            if (country.obi_scores) {
              country.obi_scores = _.sortBy(country.obi_scores, 'year');
            }
            callback(err, country);
          });
        },
        sites: function(callback) {
          sites.listAll(callback);
        },
      }, function(err, results) {
        var country = results.country,
            sites = results.sites,
            now = moment();
        if (!country) {
          return callback(err, null);
        }

        sites = _.where(results.sites, {country: country.country, active: true});
        sites = _.map(sites, function(site) {
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

        country.sites = sites;
        callback(err, country);
      });
    },
};
