var Mongo = require('mongodb');
    config = require('./config'),
    db = undefined;


module.exports = {
    init: function(callback) {
        if (!config.valid()) {
            return callback("Set valid DB variables in the .env file.");
        }

        Mongo.MongoClient.connect(config.DB_PATH, function(err, database) {
            db = database;
            callback(err);
        });
    },
    close: function() {
        if (db) {
            db.close();
        }
    },
    coll: function(name, callback) {
        if (db) {
            callback(null, db.collection(name));
        } else {
            callback("Database not initialised. Call db#init first.");
        }
    }
}
