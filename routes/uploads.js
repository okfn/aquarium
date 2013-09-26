var db = require('../lib/db'),
    isAuthenticated = require('../lib/auth'),
    janitor = require('../lib/janitor'),
    uploads = require('../lib/uploads'),
    formidable = require('formidable'),
    docs = require('../lib/documents'),
    util = require('util');

module.exports = {
    init: function(app) {
        app.get('/documents/:id/uploads', isAuthenticated, module.exports.showAttachments);

        app.post('/documents/:id/uploads', isAuthenticated, module.exports.addAttachment);
    },
    addAttachment: function(req, res) {
        docs.exists({
            id: req.params.id
        }, function(err, exists) {
            if (err) {
                return janitor.error(res, err);
            } else if (!exists) {
                return janitor.missing(res);
            }

            form.parse(req, function(err, fields, files) {
                res.writeHead(200, {'content-type': 'text/plain'});
                res.write('received upload:\n\n');
                res.end(util.inspect({fields: fields, files: files}));
            });
        });
    },
    showAttachments: function(req, res) {
        docs.get({
            id: req.params.id
        }, function(err, doc) {
            if (err) {
                return janitor.error(res, err);
            } else if (!doc) {
                return janitor.missing(res);
            }
            res.render('uploads', {
                backButton: true,
                doc: doc,
                title: doc.title
            });
        });
    }
}
