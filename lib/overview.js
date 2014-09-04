var _ = require('underscore'),
    async = require('async'),
    documents = require('./documents'),
    moment = require('moment'),
    sites = require('./sites'),
    countries = require('./countries'),
    types;

types = [
    "Pre-Budget Statement",
    "Executive's Budget Proposal",
    "Enacted Budget",
    "Citizen's Budget",
    "In-Year Report",
    "Mid-year Review",
    "Year-End Report",
    "Audit Report"
];

module.exports = {
    getGrid: function(callback) {
        async.waterfall([
            // get obi scores from countries
            function(callback) {
                countries.list({}, callback);
            },
            // decorate grid with sites
            function(countries, callback) {
                module.exports.createSiteGrid(function(err, sites) {
                    // init cells if not updated
                    _.each(countries, function(country) {
                        country.cells = new Array(8);
                    });
                    callback(err, countries, sites);
                });
            },
            // merge countries and sites arrays
            function(countries, sites, callback) {
                _.each(sites, function(site) {
                    var row = _.findWhere(countries, {
                        country: site.country
                    });

                    if (row) {
                        row.cells = site.cells;
                    } else {
                        countries.push(site);
                    }
                });

                callback(null, countries);
            },
            // fetch documents
            function(grid, callback) {
                documents.list({
                    admin: true,
                    approved: true
                }, function(err, docs) {
                    callback(err, grid, docs);
                });
            },
            // merge documents with grid
            function(grid, docs, callback) {
                _.each(docs, function(doc) {
                    module.exports.updateGrid(grid, doc);
                });

                callback(null, grid);
            }
        ], function(err, grid) {
            callback(err, _.sortBy(grid, 'country'));
        });
    },
    // TODO: Filter by year
    getDocuments: function(callback) {
        async.waterfall([
            // get obi scores from countries
            function(callback) {
                countries.list({}, callback);
            },
            // decorate grid with sites
            function(countries, callback) {
                module.exports.createDocumentsGrid(function(err, docs) {
                    var cleanDocs;

                    cleanDocs = _.map(docs, function(doc) {
                      var cleanDoc = {
                          country: doc.country,
                          title: doc.title,
                          type: doc.type,
                          approved: doc.approved,
                          expected_date_published: doc.expected_date_published,
                          date_published: doc.date_published,
                          date_received: doc.date_received,
                      };

                      cleanDoc.state = documents.getDocumentState(cleanDoc);

                      return cleanDoc;
                    });

                    callback(err, countries, cleanDocs);
                });
            },
            function(countries, docs, callback) {
              var docsByCountry = _.groupBy(docs, 'country');

              _.each(countries, function(country) {
                var docs = docsByCountry[country.country];
                docs = _.map(docs, function(doc) {
                  delete doc.country;
                  return doc;
                });
                country.documents = _.groupBy(docs, 'type');
              });

              callback(null, countries);
            },
        ], function(err, documents) {
            callback(err, documents);
        });
    },
    updateGrid: function(grid, doc) {
        var cell,
            index,
            row;

        row = _.findWhere(grid, {
            country: doc.country
        });

        if (row) {
            index = _.indexOf(types, doc.type);

            cell = row.cells[index];

            if (!cell) {
                cell = row.cells[index] = {};
            }

            // no existing data
            if (!cell.year) {
                cell.year = doc.year;
                if (cell.expected_year > cell.year) {
                    cell.state = 'late';
                } else if (doc.available) {
                    cell.state = 'available';
                }
            }
        }
    },
    createSiteGrid: function(callback) {
        var query = {};
        sites.listAll(query, function(err, sites) {
            var countries,
                grid;

            if (err) {
                return callback(err);
            }
            countries = module.exports.getSiteCountries(sites);
            grid = module.exports.arrangeGrid(countries);

            callback(null, grid);
        });
    },
    createDocumentsGrid: function(callback) {
      var query = {
        year: moment().year()
      };
      documents.listAll(query, function(err, docs) {
        callback(err, docs);
      });
    },
    getSiteCountries: function(sites) {
        return _.groupBy(sites, function(site) {
            return site.country;
        });
    },
    arrangeGrid: function(countries) {
        var grid = [];

        _.each(countries, function(sites, country) {
            var existing,
                now = moment(),
                cells = new Array(types.length);

            existing = _.findWhere(grid, {
                country: country
            });

            if (existing) {
                cells = existing.cells;
            }

            _.each(sites, function(site) {
                var date = (site.search_dates || {}).start,
                    index = _.indexOf(types, site.type);

                if (index >= 0) {
                    // could improve later; for now just start date wins
                    cells[index] = {
                        type: site.type,
                        state: moment(date) < now ? 'late' : 'waiting',
                        date: date,
                        expected_year: date ? moment(date).year() : undefined
                    };
                }
            });

            // only need to add if not already in grid
            if (!existing) {
                grid.push({
                    country: country,
                    cells: cells
                });
            }

        });
        return grid;
    }
};
