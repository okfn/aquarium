var _ = require('underscore'),
    db = require('./db'),
    users = require('./users');

module.exports = {
    count: function(options, callback) {
        var sites = db.coll('sites');

        sites.find({}, function(err, cursor) {
            var count = 0;

            if (err) {
                return callback(err);
            }

            cursor.toArray(function(err, sites) {
                _.each(sites, function(site) {
                    count += site.value;
                });

                callback(null, count);
            });
        });
    },
    list: function(options, callback) {
        var query = {},
            userColl = db.coll('users');

        if (options.username && !options.isAdmin) {
            query.username = options.username;
        }

        userColl.findOne(query, function(err, user) {
            var sites;

            if (err) {
                callback(err);
            } else {
                sites = _.sortBy(user.sites, function(site) {
                    return site.url;
                });

                if (options.search) {
                    sites = _.filter(sites, function(site) {
                        var re = new RegExp(options.search, 'i');

                        return re.test(site.url) || re.test(site.title) || re.test(site.type);
                    });
                }
                callback(null, {
                    total: user.sites.length,
                    items: sites
                });
            }
        });
    },
    insert: function(options, callback) {
        var userColl = db.coll('users'),
            now = new Date().toISOString();

        userColl.update({
            username: options.username
        }, {
            $push: {
                sites: {
                    active: true,
                    created_at: now,
                    last_modified: now,
                    title: options.title,
                    type: options.type,
                    url: options.url
                }
            }
        }, callback);
    },
    updateSites: function(options, callback) {
        options.site.last_modified = new Date().toISOString();

        users.update({
            username: options.user.username
        }, {
            $set: {
                sites: options.user.sites
            }
        }, callback);
    },
    getSite: function(options, callback) {
        users.getUser(options.username, function(err, user) {
            var site;

            if (err) {
                return callback(err);
            } else if (!user) {
                return callback("Could not find user with id " + options.username);
            }

            site = _.find(user.sites, function(site) {
                return site.created_at === options.created_at;
            });

            if (!site) {
                return callback("Could not find site created at " + options.created_at);
            }

            _.defaults(site, {
                publication_dates: []
            });

            callback(null, user, site);
        });
    },
    deleteDate: function(options, callback) {
        module.exports.getSite(options, function(err, user, site) {
            var index;

            if (err) {
                return callback(err);
            }

            site.publication_dates = _.without(site.publication_dates, options.publication_date);

            module.exports.updateSites({
                site: site,
                user: user
            }, callback);
        });
    },
    remove: function(options, callback) {
        module.exports.getSite(options, function(err, user, site) {
            var index;

            if (err) {
                return callback(err);
            }

            user.sites = _.without(user.sites, site);

            module.exports.updateSites({
                site: site,
                user: user
            }, callback);
        });
    },
    addDate: function(options, callback) {
        module.exports.getSite(options, function(err, user, site) {
            if (err) {
                return callback(err);
            }

            site.publication_dates.push(options.publication_date);
            site.publication_dates.sort();

            module.exports.updateSites({
                site: site,
                user: user
            }, callback);
        });
    },
    changeActiveStatus: function(options, callback) {
        module.exports.getSite(options, function(err, user, site) {
            if (err) {
                return callback(err);
            }

            site.active = options.active;

            module.exports.updateSites({
                site: site,
                user: user
            }, callback);
        });
    },
    enable: function(options, callback) {
        options.active = true;
        module.exports.changeActiveStatus(options, callback);
    },
    disable: function(options, callback) {
        options.active = false;
        module.exports.changeActiveStatus(options, callback);
    }
};
