var _ = require('underscore'),
    db = require('./db'),
    path = require('path');

module.exports = {
    count: function(options, callback) {
        var files = db.coll('fs.files');

        files.count({
            "metadata.docId": options.docId
        }, callback);
    },
    list: function(options, callback) {
        var files = db.coll('fs.files');

        files.find({
            "metadata.docId": options.docId
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

            store.write(new Buffer(data).toString('base64'), function(err, store) {
                if (err) {
                    return callback(err);
                }

                store.close(callback);
            });
        });
    }
};
