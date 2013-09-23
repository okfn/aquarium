var _ = require('underscore'),
    db = require('./db');

module.exports = {
    list: function(options, callback) {
        var query = {},
            users = db.coll('users');

        if (options.username && !options.isAdmin) {
            query.username = options.username;
        }

        users.findOne(query, function(err, user) {
            if (err) {
                callback(err);
            } else {
                callback(null, _.sortBy(user.sites, function(site) {
                    return site.url;
                }));
            }
        });
    },
    insert: function(options, callback) {
        var users = db.coll('users');

        users.update({
            username: options.username
        }, {
            $push: {
                sites: {
                    last_modified: new Date().toISOString(),
                    url: options.url
                }
            }
        }, callback);
    }
};
