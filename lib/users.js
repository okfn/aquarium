var _ = require('underscore'),
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
            data._id = data.username;

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
     */
    exists: function(id, callback) {
        module.exports.getUser(id, function(err, user) {
            callback(err, !!user);
        });
    },
    /**
     * Gets the user with the given id (i.e. username)
     */
    getUser: function(id, callback) {
        var users = db.coll('users');

        users.findOne({
            _id: id
        }, callback);
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

        if (options.admin == null) {
            options.admin = false;
        }
        users.count(options, callback);
    },
    list: function(callback) {
        var users = db.coll('users');

        users.find({
            $query: {
                admin: false
            },
            $orderby: {
                name: 1
            }
        }).toArray(callback);
    },
    update: function(query, update, callback) {
        var users = db.coll('users');

        users.update(query, update, callback);
    }

};
