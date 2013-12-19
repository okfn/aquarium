var _ = require('underscore'),
    db = require('./db');

module.exports = {
    list: function(options, callback) {
        var docs = db.coll('documents'),
            page = options.page || 0,
            pageSize = options.pageSize || 25,
            query = {};

        if (!options.admin) {
            query.username = options.username;
        }
        if (options.approved !== undefined) {
            query.approved = options.approved;
        }
        if (options.country) {
            query.country = options.country;
        }

        docs.find({
            $orderby: {
                created_at: -1,
                year: -1,
                approved: 1
            },
            $query: query
        }).limit(pageSize).skip((page - 1) * pageSize).toArray(callback);
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
