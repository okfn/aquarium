var db = require('../lib/db'),
    isAuthenticated = require('../lib/auth'),
    janitor = require('../lib/janitor'),
    docs = require('../lib/documents');

module.exports = {
    init: function(app) {
        app.get('/documents', isAuthenticated, module.exports.showDocs);
        app.get('/documents/new', isAuthenticated, module.exports.newDoc);
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
    }
};
