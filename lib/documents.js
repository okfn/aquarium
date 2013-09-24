var _ = require('underscore'),
    db = require('./db');

module.exports = {
    list: function(options, callback) {
        var docs = db.coll('documents');

        docs.find({
            $orderby: {
                created_at: -1
            },
            $query: {
                username: options.username
            }
        }).toArray(callback);
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
