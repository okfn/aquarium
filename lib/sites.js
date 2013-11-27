var _ = require('underscore'),
    db = require('./db'),
    users = require('./users');

module.exports = {
    /**
     * Sites is a synthetic collection which has as its value the number of sites a particular user has.
     *
     * Count gets total number and options is ignored for now.
     */
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
    /**
     * Lists sites for a given user.
     *
     * Will not work as intended for admin users.
     *
     * @param {String} username to get sites for
     * @param {String} search tests the site's url, title & type by the string
     */
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
    /**
     * Adds a new site.
     *
     * @param {String} username the user to add the site to
     * @param {String} title
     * @param {String} type
     * @param {String} url
     */
    insert: function(options, callback) {
        var userColl = db.coll('users'),
            now = new Date();

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
    /**
     * Convenience method to update the sites array for a user.
     *
     * Depends on the sites collection having already been updated; simply persists the changes to the db.
     *
     * @param {Object} user
     * @param {String} user.username
     * @param {Array} user.sites
     * @param {Object} site the object to set the last_modified on
     */
    updateSites: function(options, callback) {
        options.site.last_modified = new Date();

        users.update({
            username: options.user.username
        }, {
            $set: {
                sites: options.user.sites
            }
        }, callback);
    },
    /**
     * Get a site.
     *
     * @param {String} username
     * @param {String} created_at ISOString value of the Date the site was added to the user.
     */
    getSite: function(options, callback) {
        users.getUser(options.username, function(err, user) {
            var site;

            if (err) {
                return callback(err);
            } else if (!user) {
                return callback("Could not find user with id " + options.username);
            }

            site = _.find(user.sites, function(site) {
                return site.created_at.toISOString() === options.created_at;
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
    /**
     * Removes the site with the matching created_at date.
     *
     * @param {String} username
     * @param {String} created_at ISOString formatted date site was created at
     */
    remove: function(options, callback) {
        module.exports.getSite(options, function(err, user, site) {
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
    /**
     * Add a publication date to the site with the matching created_at.
     *
     * @param {String} username
     * @param {String} created_at ISOString value of the Date the site was added to the user.
     * @param {Date} publication_date the Date to add to the site.
     */
    addDate: function(options, callback) {
        module.exports.getSite(options, function(err, user, site) {
            if (err) {
                return callback(err);
            }

            site.publication_dates.push(options.publication_date);
            site.publication_dates = _.sortBy(site.publication_dates, function(d) {
                return d.getTime();
            });

            module.exports.updateSites({
                site: site,
                user: user
            }, callback);
        });
    },
    /**
     * Delete all publication dates with the matching created_at.
     *
     * @param {String} username
     * @param {String} created_at ISOString value of the Date the site was added to the user.
     * @param {Date} publication_date the Date to remove from the site.
     */
    deleteDate: function(options, callback) {
        module.exports.getSite(options, function(err, user, site) {
            if (err) {
                return callback(err);
            }

            site.publication_dates = _.reject(site.publication_dates, function(d) {
                return d.getTime() === options.publication_date.getTime();

            });

            module.exports.updateSites({
                site: site,
                user: user
            }, callback);
        });
    },
    /**
     * Change the active state of a site.
     *
     * @param {String} username
     * @param {String} created_at ISOString value of the Date the site was added to the user.
     * @param {Boolean} active
     */
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
    /**
     * Make a site active.
     *
     * @param {String} username
     * @param {String} created_at ISOString value of the Date the site was added to the user.
     */
    enable: function(options, callback) {
        options.active = true;
        module.exports.changeActiveStatus(options, callback);
    },
    /**
     * Make a site inactive.
     *
     * @param {String} username
     * @param {String} created_at ISOString value of the Date the site was added to the user.
     */
    disable: function(options, callback) {
        options.active = false;
        module.exports.changeActiveStatus(options, callback);
    }
};
