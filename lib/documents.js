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
    exists: function(options, callback) {
        module.exports.get(options, function(err, doc) {
            callback(err, !!doc);
        });
    },
    get: function(options, callback) {
        var docs = db.coll('documents'),
            id;

        // hackery for mongodb's ObjectID function
        if (options.id && options.id.length === 24) {
            id = db.ObjectID(options.id);
        } else {
            id = options.id;
        }

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
            now = new Date().toISOString();

        data.username = options.username;
        data.created_at = data.last_modified = now;

        docs.insert(data, callback);
    },
    update: function(options, callback) {
        var data = _.omit(options.data, 'username', 'created_at'), // in case they get passed
            docs = db.coll('documents'),
            now = new Date().toISOString(),
            id;

        data.last_modified = now;

        if (options.id && options.id.length === 24) {
            id = db.ObjectID(options.id);
        } else {
            id = options.id;
        }

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
