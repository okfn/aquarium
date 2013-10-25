var _ = require('underscore'),
    documents = require('./documents'),
    db = require('./db'),
    path = require('path');

module.exports = {
    count: function(options, callback) {
        var files = db.coll('fs.files');

        files.count({
            "metadata.docId": options.docId
        }, callback);
    },
    get: function(options, callback) {
        var filename = options.path,
            store;

        store = db.getGridStore(filename, 'r');

        store.open(function(err, store) {
            if (err) {
                return callback(err);
            }

            store.read(function(err, data) {
                if (err) {
                    return callback(err);
                }

                store.close(function() {});
                callback(null, {
                    content_type: store.contentType,
                    data: data,
                    metadata: store.metadata
                });
            });
        });
    },
    list: function(options, callback) {
        var files = db.coll('fs.files');

        files.find({
            $orderby: {
                uploadDate: 1
            },
            $query: {
                "metadata.docId": options.docId
            }
        }).toArray(callback);
    },
    insert: function(options, callback) {
        var filename = options.filename,
            content_type = options.content_type,
            data = options.data,
            docId = options.docId,
            handle = path.join(docId, filename),
            store;

        store = db.getGridStore(handle, 'w', {
            content_type: options.content_type,
            metadata: {
                filename: filename,
                docId: docId
            }
        });

        store.open(function(err, store) {
            if (err) {
                return callback(err);
            }

            store.write(data, function(err, store) {
                if (err) {
                    return callback(err);
                }

                documents.addUpload({
                    id: docId,
                    name: filename,
                    filename: store.filename
                }, function(err) {
                    if (err) {
                        return callback(err);
                    }

                    store.close(callback);
                });
            });
        });
    }
};
