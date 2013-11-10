var _ = require('underscore'),
    db = require('./db');

module.exports = {
    list: function(options, callback) {
        var docs = db.coll('documents'),
            query = {};

        if (!options.admin) {
            query.username = options.username;
        }

        docs.find({
            $orderby: {
                created_at: -1,
                approved: 1
            },
            $query: query
        }).toArray(callback);
    },
    overview: function(callback) {
        var docs = db.coll('documents');

        docs.find({
            $orderby: {
                country: 1
            },
            $query: {
                approved: true
            }
        }, function(err, cursor) {
            if (err) {
                callback(err);
            }

            cursor.toArray(function(err, docs) {
                var countries = _.groupBy(docs, function(doc) {
                    return doc.country;
                });

                callback(null, module.exports.generatePulseGrid(countries));
            });
        });
    },
    generatePulseGrid: function(countries) {
        var keys = [ "Pre-Budget Statement", "Executive’s Budget Proposal", "Enacted Budget", "Citizen's Budget", "In-Year Report", "Mid-year Review", "Year-End Report", "Audit Report" ];

        return _.map(countries, function(documents) {
            var country,
                flags = new Array(keys.length);

            _.each(documents, function(document) {
                var index = _.indexOf(keys, document.type);

                country = document.country;

                if (index >= 0) {
                    flags[index] = document.available;
                }
            });

            return {
                country: country,
                flags: flags
            };
        });
    },
    exists: function(options, callback) {
        module.exports.get(options, function(err, doc) {
            callback(err, !!doc);
        });
    },
    get: function(options, callback) {
        var docs = db.coll('documents'),
            id = module.exports.getId(options);

        docs.findOne({
            _id: id
        }, callback);
    },
    count: function(options, callback) {
        var docs = db.coll('documents'),
            query = {};

        if (options.$query) {
            query = options.$query;
        }

        docs.count(query, callback);
    },
    countUnapproved: function(options, callback) {
        options.$query = {
            approved: {
                $ne: true
            }
        };
        module.exports.count(options, callback);
    },
    insert: function(options, callback) {
        var docs = db.coll('documents'),
            data = options.data,
            now = new Date();

        data.username = options.username;
        data.created_at = data.last_modified = now;

        docs.insert(data, callback);
    },
    addUpload: function(options, callback) {
        var docs = db.coll('documents');

        docs.update({
            _id: module.exports.getId(options)
        }, {
            $addToSet: {
                uploads: {
                    name: options.name,
                    filename: options.filename
                }
            }
        }, function(err, result) {
            callback(err, result);
        });
    },
    // hackery for mongodb's ObjectID function
    getId: function(options) {
        if (options.id && options.id.length === 24) {
            return db.ObjectID(options.id);
        } else {
            return options.id;
        }
    },
    update: function(options, callback) {
        var data = _.omit(options.data, 'username', 'created_at'), // in case they get passed
            docs = db.coll('documents'),
            now = new Date(),
            id = module.exports.getId(options);

        data.last_modified = now;

        if (options.resetApproved) {
            data.approved = undefined;
        }

        docs.update({
            _id: id
        }, {
            $set: data
        }, callback);
    }
};
