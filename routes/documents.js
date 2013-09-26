var db = require('../lib/db'),
    isAuthenticated = require('../lib/auth'),
    janitor = require('../lib/janitor'),
    docs = require('../lib/documents');

module.exports = {
    init: function(app) {
        app.get('/documents', isAuthenticated, module.exports.showDocs);
        app.get('/documents/new', isAuthenticated, module.exports.newDoc);
        app.get('/documents/:id', isAuthenticated, module.exports.showDoc);
        app.get('/documents/:id/edit', isAuthenticated, module.exports.editDoc);

        app.post('/documents', isAuthenticated, module.exports.createDoc);
        app.post('/documents/:id', isAuthenticated, module.exports.updateDoc);
    },
    showDocs: function(req, res) {
        docs.list({
            admin: !!req.user.admin,
            username: req.user.username
        }, function(err, docs) {
            if (err) {
                return janitor.error(res, err);
            }
            res.render('documents', {
                docs: docs,
                title: 'User Documents'
            });
        });
    },
    editDoc: function(req, res) {
        docs.get({
            id: req.params.id
        }, function(err, doc) {
            if (err) {
                return janitor.error(res, err);
            } else if (!doc) {
                return janitor.missing(res);
            }
            res.render('editdoc', {
                doc: doc,
                title: doc.title
            });
        });
    },
    showDoc: function(req, res) {
        docs.get({
            id: req.params.id
        }, function(err, doc) {
            if (err) {
                return janitor.error(res, err);
            } else if (!doc) {
                return janitor.missing(res);
            }
            res.render('document', {
                doc: doc,
                title: doc.title
            });
        });
    },
    newDoc: function(req, res) {
        res.render('newdoc', {
            title: 'New Document'
        });
    },
    createDoc: function(req, res) {
        var options = {
            username: req.user.username,
            data: extractDoc(req)
        };

        docs.insert(options, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/documents');
        });
    },
    updateDoc: function(req, res) {
        var id = req.params.id;

        docs.get({
            id: id
        }, function(err, doc) {
            if (err || !doc) {
                return janitor.error(res, err || 'Invalid document.');
            } else if (!req.user.admin && doc.username !== req.user.username) {
                return janitor.error(res, "Unable to update document.");
            }

            docs.update({
                data: extractDoc(req),
                id: id
            }, function(err) {
                if (err) {
                    return janitor.error(res, err);
                }

                res.redirect('/documents');
            });
        });
    }
};

function extractDoc(req) {
    return {
        type: req.body.type,
        title: req.body.title,
        available: req.body.available === 'yes',
        comments: req.body.comments,
        location: {
            category: req.body.location,
            detail: req.body.location_detail
        },
        url: req.body.url,
        date_published: req.body.date_published,
        date_received: req.body.date_received,
        softcopy: req.body.softcopy === 'yes',
        scanned: req.body.scanned === 'yes'
    };
}
