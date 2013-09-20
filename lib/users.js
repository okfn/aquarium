var db = require('./db');

module.exports = {
    insert: function(options, callback) {
        var users = db.coll('users');

        users.insert(options, function(err, users) {
            var user;

            if (err) {
                callback(err);
            } else {
                user = users[0];
                callback(null, user);
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
