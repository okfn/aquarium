var async = require('async'),
    _ = require('underscore'),
    bcrypt = require('bcrypt'),
    db = require('./db');

module.exports = {
    /**
     * Insert user supplied in `user` propety.
     * `password` field required for bcrypt to work.
     * Checks that `username` is unique.
     */
    insert: function(options, callback) {
        var users = db.coll('users'),
            data = options.user,
            password = options.password;

        bcrypt.hash(password, 10, function(err, hash) {
            if (err) {
                return callback(err);
            }

            data.hash = hash;

            module.exports.exists(data.username, function(err, exists) {
                if (err) {
                    return callback(err);
                }

                if (exists) {
                    callback("User with id '" + data.username + "' already exists.");
                }

                users.insert(data, function(err, users) {
                    var user;

                    if (err) {
                        return callback(err);
                    }
                    user = users[0];
                    callback(null, user);
                });
            });
        });
    },
    /**
     * Whether a user with a given id exists
     *
     * @param {String} username
     * @param {Function} callback is passed true or false
     */
    exists: function(username, callback) {
        module.exports.getUser({
            username: username
        }, function(err, user) {
            callback(err, !!user);
        });
    },
    /**
     * Gets the user with the given id
     *
     * @param {String} id
     * @param {Function} callback
     *
     */
    getUserById: function(id, callback) {
        module.exports.getUser({
            _id: db.getId(id)
        }, callback);
    },
    /**
     * Gets the user with the given username
     *
     * @param {Object} query
     * @param {Function} callback
     *
     */
    getUser: function(query, callback) {
        var users = db.coll('users');

        users.findOne(query, callback);
    },
    /**
     * Callback called with null, true if database has no users.
     */
    isEmpty: function(callback) {
        var users = db.coll('users');

        users.count(function(err, count) {
            callback(err, count === 0);
        });
    },
    count: function(options, callback) {
        var users = db.coll('users');

        /*jshint eqnull: true*/
        if (options.admin == null) {
            options.admin = false;
        }
        users.count(options, callback);
    },
    list: function(callback) {
        var users = db.coll('users');

        users.find({
            $query: { },
            $orderby: {
                name: 1
            }
        }).toArray(callback);
    },
    update: function(query, update, callback) {
        var users = db.coll('users');

        users.update(query, update, callback);
    },
    /**
     * Update the user.
     *
     * Updates password if present and admin or if current password given
     *
     * @param {Object} options
     * @param {Function} callback
     */
    updateUser: function(options, callback) {
        var users = db.coll('users'),
            user = options.user;

        async.waterfall([
            // check current password if setting.
            // admins can always set password
            function(callback) {
                if (options.password) {
                    if (options.admin) {
                        callback(null, true);
                    } else {
                        bcrypt.compare(options.current, user.hash, function(err, matches) {
                            if (err || !matches) {
                                callback(err || "Incorrect password.");
                            } else {
                                callback(null, true);
                            }
                        });
                    }
                } else {
                    callback(null, false);
                }
            },
            // if we need to update the password do it now
            function(setPassword, callback) {
                if (setPassword) {
                    bcrypt.hash(options.password, 10, function(err, hash) {
                        if (hash) {
                            user.hash = hash;
                        }
                        callback(err);
                    });
                } else {
                    callback();
                }
            },
            // update details
            function(callback) {
                _.extend(user, _.pick(options.data, 'username', 'name', 'mute', 'locale'));

                users.save(user, callback);
            }
        ], function(err) {
            callback(err);
        });
    },
    /**
     * remove the user with the match user_id
     * Can't be used to delete yourself.
     *
     * @param {Object} options
     * @param {String} options.user_id
     * @param {String} options.currentUser
     * @param {Function} callback
     */
    remove: function(options, callback) {
        var users = db.coll('users'),
            currentUser = options.currentUser,
            userId = options.user_id;

        if (currentUser._id === userId) {
            return callback("Can't delete yourself.");
        }

        users.remove({
            _id: db.getId(options.user_id)
        }, function(err) {
            callback(err);
        });
    },
    drop: function() {
      var users = db.coll('users');
      users.drop();
    }
};
