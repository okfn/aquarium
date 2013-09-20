var db = require('./db');

module.exports = {
    insert: function(options, callback) {
        var users = db.coll('users');

        users.insert(options, callback);
    },
    isEmpty: function(callback) {
        var users = db.coll('users');

        users.count(function(err, count) {
            callback(err, count === 0);
        });
    }
};
