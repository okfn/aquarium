var _ = require('underscore'),
    async = require('async'),
    db = require('./db'),
    sites = require('./sites'),
    documents = require('./documents'),
    snapshots = require('./snapshots');

module.exports = {
    /**
     * Returns all countries in the collection with the last score/year combo
     *
     * @param {Function} callback
     *
     */
    list: function(options, callback) {
      var countries = db.coll('countries'),
          query = options.query || {};

      async.waterfall([
        // get countries
        function(callback) {
          countries.find({
            $orderby: {
              country: 1,
            },
            $query: query
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
        // get sites
        function(countries, callback) {
          var query = {
            admin: false,
          };
          sites.listAll(query, function(err, sites) {
            if (err || !sites) {
              return callback(err || {}, countries);
            }
            _.each(countries, function(country) {
              var countrySites = _.filter(sites, function(s) {
                return s.country === country.country;
              });
              country.sites = cleanSites(countrySites);
            });

            callback(err, countries);
          });
        },
        // get documents
        function (countries, callback) {
          var query = {'approved':true};

          documents.listAll(query, function(err, docs) {
            if (err || !docs) {
              return callback(err || {}, countries);
            }
            _.each(countries, function(country) {
              var countryDocs = _.filter(docs, function(d) {
                return d.country === country.country;
              });
              country.documents = cleanDocuments(countryDocs);
            });

            callback(err, countries);
          });
        },
	function (countries, callback) {
          snapshots.listAll({}, function(err, shots) {
            if (err || !shots) {
              return callback(err || {}, countries);
            }
            _.each(countries, function(country) {
              var countryShots = _.filter(shots, function(d) {
                return d.code === country.code;
              });
              country.snapshots = cleanSnapshots(countryShots);
            });

            callback(err, countries);
          });
        }
      ], callback);
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
      var countries = db.coll('countries');

      module.exports.list(options, function(err, countries) {
        callback(err, countries[0]);
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

function cleanSites(sites) {
  return _.map(sites, function(site) {
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
}

function cleanDocuments(docs) {
  docs = _.map(docs, function(doc) {
    var theDoc = {
          state: documents.getDocumentState(doc),
        },
        attributes = [
          'year', 'title', 'type', 'approved',
          'date_published', 'date_received', 'comments'
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
  docs = _.groupBy(docs, 'year');
  _.each(docs, function(doc, year) {
    _.each(docs[year], function (doc) {
      delete doc.year;
    });
    docs[year] = _.groupBy(docs[year], 'type');
  });

  return docs;
}

function cleanSnapshots(snapshots) {
  snapshots = _.map(snapshots, function(snapshot) {
    return {
	'date': snapshot.date,
	'snapshot': snapshot.snapshot
    };
  });

  return snapshots;
}
