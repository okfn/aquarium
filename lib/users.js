var bcrypt = require('bcrypt'),
    db = require('./db');

module.exports = {
    insert: function(options, callback) {
        var users = db.coll('users'),
            data = options.user,
            password = options.password;

        bcrypt.hash(password, 10, function(err, hash) {
            if (err) {
                callback(err);
            } else {
                data.hash = hash;
                data._id = user.username;
                users.insert(data, function(err, users) {
                    var user;

                    if (err) {
                        callback(err);
                    } else {
                        user = users[0];
                        callback(null, user);
                    }
                });
            }
        });
    },
    isEmpty: function(callback) {
        var users = db.coll('users');

        users.count(function(err, count) {
            callback(err, count === 0);
        });
    }
};
