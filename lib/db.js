var Mongo = require('mongodb'),
    config = require('./config'),
    db;

module.exports = {
    init: function(callback) {
        if (!config.valid()) {
            return callback("Set valid DB variables in the .env file.");
        }

        Mongo.MongoClient.connect(config.DB_PATH, function(err, database) {
            if (err) {
                callback(err);
            } else {
                db = database;
                module.exports.createSchema(db, callback);
            }
        });
    },
    getDb: function() {
        return db;
    },
    createSchema: function(db, callback) {
        db.createCollection('users', function(err) {
            callback(err, db);
        });
    },
    close: function() {
        if (db) {
            db.close();
        }
    },
    coll: function(name) {
        if (db) {
            return db.collection(name);
        } else {
            return null;
        }
    }
}
