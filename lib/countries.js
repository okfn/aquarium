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
                    var score = _.last(country.obi_scores);

                    return {
                        country: country.country,
                        code: country.code,
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
          countries.findOne(options, callback);
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

        sites = _.where(results.sites, {country: country.country});
        sites = _.map(sites, function(site) {
          var date = (site.search_dates || {}).start;

          return {
            title: site.title,
            type: site.type,
            state: moment(date) < now ? 'late' : 'waiting',
            expected_date: date,
          };
        });

        country.documents = sites;
        callback(err, country);
      });
    },
};
