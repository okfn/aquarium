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
            now = new Date().toISOString();

        data.username = options.username;
        data.created_at = now;
        data.last_modified = now;

        docs.insert(data, callback);
    }
};
