var db = require('../lib/db'),
    auth = require('../lib/auth'),
    janitor = require('../lib/janitor'),
    uploads = require('../lib/uploads'),
    fs = require('fs'),
    docs = require('../lib/documents'),
    util = require('util');

module.exports = {
    init: function(app) {
        app.get('/documents/:id/uploads', auth.authenticated, module.exports.showAttachments);
        app.get('/uploads/:id/:filename', auth.authenticated, module.exports.showAttachment);

        app.post('/documents/:id/uploads', auth.authenticated, module.exports.addAttachment);
    },
    saveAttachment: function(options) {
        var docId = options.docId,
            path = options.file.path,
            content_type = options.file.type,
            filename = options.file.name,
            res = options.res;

        fs.readFile(path, function(err, data) {
            if (err) {
                return janitor.error(res, err);
            }
            uploads.insert({
                content_type: content_type,
                filename: filename,
                data: data,
                docId: docId
            }, function(err) {
                if (err) {
                    return janitor.error(res, err);
                }

                fs.unlink(path, function(err) {
                    if (err) {
                        return janitor.error(res, err);
                    }

                    res.redirect('/documents/' + docId + '/uploads');
                });
            });
        });
    },
    addAttachment: function(req, res) {
        var id = req.params.id;

        docs.exists({
            id: id
        }, function(err, exists) {
            if (err) {
                return janitor.error(res, err);
            } else if (!exists) {
                return janitor.missing(res);
            } else if (!req.files.upload) {
                return janitor.error(res, "Missing attached file.");
            }

            module.exports.saveAttachment({
                docId: id,
                file: req.files.upload,
                res: res
            });
        });
    },
    showAttachment: function(req, res) {
        uploads.get({
            path: req.params.id + '/' + req.params.filename
        }, function(err, upload) {
            var content;

            if (err) {
                return janitor.error(res, err);
            }

            content = upload.data;

            res.writeHead(200, {
                'Content-disposition': 'attachment;filename=' + upload.metadata.filename,
                'Content-Length': content.length,
                'Content-Type': upload.content_type
            });

            res.end(content);
        });
    },
    showAttachments: function(req, res) {
        var id = req.params.id;

        docs.get({
            id: id
        }, function(err, doc) {
            if (err) {
                return janitor.error(res, err);
            } else if (!doc) {
                return janitor.missing(res);
            }
            uploads.list({
                docId: id
            }, function(err, uploads) {
                res.render('uploads', {
                    backButton: true,
                    doc: doc,
                    uploads: uploads,
                    title: doc.title
                });
            });
        });
    }
}
