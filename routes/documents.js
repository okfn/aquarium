var db = require('../lib/db'),
    isAuthenticated = require('../lib/auth'),
    janitor = require('../lib/janitor'),
    docs = require('../lib/documents');

module.exports = {
    init: function(app) {
        app.get('/documents', isAuthenticated, module.exports.showDocs);
        app.get('/documents/new', isAuthenticated, module.exports.newDoc);

        app.post('/documents', isAuthenticated, module.exports.createDoc);
    },
    showDocs: function(req, res) {
        docs.list({
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
    newDoc: function(req, res) {
        res.render('newdoc', {
            title: 'New Document'
        });
    },
    createDoc: function(req, res) {
        var options = {
            username: req.user.username,
            data: {
                type: req.body.type,
                title: req.body.title,
                available: req.body.available === 'yes',
                location: {
                    category: req.body.location,
                    detail: req.body.location_detail
                },
                url: req.body.url,
                date_published: req.body.date_published,
                date_received: req.body.date_received,
                softcopy: req.body.softcopy === 'yes',
                scanned: req.body.scanned === 'yes'
            }
        };

        docs.insert(options, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/documents');
        });
    }
};
