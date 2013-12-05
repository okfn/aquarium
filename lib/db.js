var async = require('async'),
    Mongo = require('mongodb'),
    config = require('./config'),
    db;

module.exports = {
    init: function(callback) {
        if (!config.valid()) {
            return callback("Set valid DB variables in the .env file.");
        }

        Mongo.MongoClient.connect(config.DB_PATH, function(err, database) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                db = database;
                module.exports.createSchema(db, callback);
            }
        });
    },
    getGridStore: function(path, mode, options) {
        return new Mongo.GridStore(db, path, mode, options);
    },
    getId: function(id) {
        if (id && id.length === 24) {
            return Mongo.ObjectID(id);
        } else {
            return id;
        }
    },
    ObjectID: Mongo.ObjectID,
    getDb: function() {
        return db;
    },
    createSchema: function(db, callback) {
        async.forEach(['users', 'documents'], function(collection, callback) {
            db.createCollection(collection, callback);
        }, function(err) {
            var users = db.collection('users');

            if (err) {
                return callback(err);
            }

            users.mapReduce(function() {
                emit(this._id, this.sites.length);
            }, function(key, values) {
                return Array.sum(values);
            }, {
                query: {
                    $where: "Array.isArray(this.sites)"
                },
                out: {
                    replace: 'sites'
                }
            }, function(err) {
                callback(err, db);
            });
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
