var _ = require('underscore'),
    db = require('./db'),
    users = require('./users');

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
        var users = db.coll('users'),
            now = new Date().toISOString();

        users.update({
            username: options.username
        }, {
            $push: {
                sites: {
                    created_at: now,
                    last_modified: now,
                    title: options.title,
                    type: options.type,
                    url: options.url
                }
            }
        }, callback);
    },
    remove: function(options, callback) {
        users.getUser(options.username, function(err, user) {
            var sites;

            if (err) {
                return callback(err);
            }
            sites = _.reject(user.sites, function(site) {
                return site.created_at === options.created_at;
            });

            users.update({
                username: options.username
            }, {
                $set: {
                    sites: sites
                }
            }, callback);
        });
    }
};
