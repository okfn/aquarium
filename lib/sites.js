var _ = require('underscore'),
    async = require('async'),
    db = require('./db'),
    moment = require('moment'),
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
     * Tests whether a given URL is already being watched. Falsey URLs are never watched.
     *
     * @param {String} url
     * @param {Function} callback
     */
    isWatched: function(url, callback) {
        var userColl = db.coll('users');

        if (url) {
            url = url.trim();

            userColl.findOne({
                "sites.url": url
            }, function(err, user) {
                callback(err, !!user);
            });
        } else {
            callback(null, false);
        }
    },
    /**
     * Lists sites for a given user.
     *
     * Will not work as intended for admin users.
     *
     * @param {String} options.user_id to get sites for
     * @param {String} options.search tests the site's url, title & type by the string
     */
    list: function(options, callback) {
        var query = {},
            userColl = db.coll('users');

        if (options.user_id && !options.isAdmin) {
            query._id = options.user_id;
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
     * Lists all sites.
     *
     */
    listAll: function(query, callback) {
        var userColl = db.coll('users');

        if (!query.admin) {
            query.admin = false;
        }

        userColl.find({
            $orderby: {
                country: 1
            },
            $query: query
        }, function(err, cursor) {
            if (err) {
                return callback(err);
            }

            cursor.toArray(function(err, users) {
                var sites = [];

                _.each(users, function(user) {
                    // country is of the form 'AF - Afghanistan'
                    var country = user.country || '';

                    country = country.split(' - ')[1] || '';

                    _.each(user.sites, function(site) {
                        // country is defined on user, not the site
                        if (site.active) {
                            sites.push(_.extend({}, site, {
                                country: country,
                                username: user.username
                            }));
                        }
                    });
                });

                callback(null, sites);
            });
        });
    },

    /**
     * Adds a new site.
     *
     * @param {String} user_id the user to add the site to
     * @param {String} title
     * @param {String} type
     * @param {String} url
     */
    insert: function(options, callback) {
        var userColl = db.coll('users'),
            now = new Date();

        async.waterfall([
            function(callback) {
                module.exports.isWatched(options.url, callback);
            },
            function(isWatched, callback) {
                if (isWatched) {
                    callback("URL is already being watched.");
                } else {
                    userColl.update({
                        _id: db.getId(options.user_id)
                    }, {
                        $push: {
                            sites: {
                                active: true,
                                created_at: now,
                                _id: new db.ObjectID(),
                                last_modified: now,
                                title: options.title,
                                type: options.type,
                                url: options.url
                            }
                        }
                    }, callback);
                }
            }
        ], callback);

    },
    /**
     * Convenience method to update the sites array for a user.
     *
     * Depends on the sites collection having already been updated; simply persists the changes to the db.
     *
     * @param {Object} user
     * @param {String} user.user_id
     * @param {Array} user.sites
     * @param {Object} site the object to set the last_modified on
     */
    updateSites: function(options, callback) {
        options.site.last_modified = new Date();

        users.update({
            _id: options.user._id
        }, {
            $set: {
                sites: options.user.sites
            }
        }, callback);
    },
    /**
     * Get the user & site for a site_id
     *
     * @param {String} site_id
     * @param {Function} callback
     */
    getSite: function(site_id, callback) {
        users.getUser({
            "sites._id": db.getId(site_id)
        }, function(err, user) {
            var site;

            if (err) {
                return callback(err);
            } else if (!user) {
                return callback("Could not find site with id " + site_id);
            }

            site = _.find(user.sites, function(site) {
                return site._id && site._id.toString() === site_id;
            });

            if (!site) {
                return callback("Could not find site with id  " + site_id);
            }

            _.defaults(site, {
                search_dates: {}
            });

            callback(null, user, site);
        });
    },
    /**
     * Removes the site with the matching created_at date.
     *
     * @param {Object} options
     * @param {String} options.site_id
     * @param {Function} callback
     */
    remove: function(options, callback) {
        module.exports.getSite(options.site_id, function(err, user, site) {
            if (err) {
                return callback(err);
            }

            var today = moment().startOf('day').toDate();
            if (site.search_dates && site.search_dates.start <= today) {
                return callback("Cannot remove document if search is started");
            }
            else {
                user.sites = _.without(user.sites, site);
            }

            module.exports.updateSites({
                site: site,
                user: user
            }, callback);
        });
    },
    /**
     * Add a publication date to the site with the matching created_at.
     *
     * @param {String} options.site_id
     * @param {Date} options.date the Date to add to the site.
     */
    addStart: function(options, callback) {
        module.exports.getSite(options.site_id, function(err, user, site) {
            if (err) {
                return callback(err);
            }

            site.search_dates = {
                start: moment(options.date).toDate()
            };

            module.exports.updateSites({
                site: site,
                user: user
            }, callback);
        });
    },
    /**
     * Add an end date to stop search for a site
     *
     * @param {String} options.site_id
     * @param {Date} options.date the Date to add to the site.
     */
    addEnd: function(options, callback) {
        module.exports.getSite(options.site_id, function(err, user, site) {
            if (err) {
                return callback(err);
            }

            var date = moment(options.date).toDate();
            if (date >= site.search_dates.start) {
                site.search_dates.end = date;
            }
            else {
                return callback("End date must come after start date");
            }

            module.exports.updateSites({
                site: site,
                user: user
            }, callback);
        });
    },
    /**
     * Delete all publication dates with the matching created_at.
     *
     * @param {String} options.site_id
     * @param {Function} callback
     */
    deleteStart: function(options, callback) {
        module.exports.getSite(options.site_id, function(err, user, site) {
            if (err) {
                return callback(err);
            }

            var today = moment().startOf('day').toDate();
            if (site.search_dates && site.search_dates.start > today) {
                delete site['search_dates'];
            }

            module.exports.updateSites({
                site: site,
                user: user
            }, callback);
        });
    },
    /**
     * Delete the end date of search for a site.
     *
     * @param {String} options.site_id
     * @param {Function} callback
     */
    deleteEnd: function(options, callback) {
        module.exports.getSite(options.site_id, function(err, user, site) {
            if (err) {
                return callback(err);
            }

            var today = moment().startOf('day').toDate();
            if (site.search_dates && site.search_dates.end >= today) {
                delete site.search_dates['end'];
            }

            module.exports.updateSites({
                site: site,
                user: user
            }, callback);
        });
    },
    /**
     * Change the active state of a site.
     *
     * @param {String} options.site_id
     * @param {Boolean} options.active
     */
    changeActiveStatus: function(options, callback) {
        module.exports.getSite(options.site_id, function(err, user, site) {
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
     * @param {String} options.site_id
     * @param {Function} callback
     */
    enable: function(options, callback) {
        options.active = true;
        module.exports.changeActiveStatus(options, callback);
    },
    /**
     * Make a site inactive.
     *
     * @param {String} options.site_id
     * @param {Function} callback
     */
    disable: function(options, callback) {
        options.active = false;
        module.exports.changeActiveStatus(options, callback);
    }
};
