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
    }
};
