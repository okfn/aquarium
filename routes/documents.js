var _ = require('underscore'),
    auth = require('../lib/auth'),
    janitor = require('../lib/janitor'),
    docs = require('../lib/documents');

module.exports = {
    init: function(app) {
        app.get('/documents', auth.authenticated, module.exports.showDocs);
        app.get('/documents/page/:page', auth.authenticated, module.exports.showDocs);
        app.get('/documents/new', auth.authenticated, module.exports.newDoc);
        app.get('/documents/:id', auth.authenticated, module.exports.showDoc);
        app.get('/documents/:id/edit', auth.authenticated, module.exports.editDoc);

        app.post('/documents', auth.authenticated, module.exports.createDoc);
        app.post('/documents/:id', auth.authenticated, module.exports.updateDoc);

        app.post('/documents/:id/approve', auth.admin, module.exports.approveDoc);
        app.post('/documents/:id/reject', auth.admin, module.exports.rejectDoc);
    },
    showDocs: function(req, res) {
        var page = parseInt(req.params.page, 10);

        if (page <= 0 || _.isNaN(page)) {
            page = 1;
        }
        docs.list({
            admin: !!req.user.admin,
            country: req.query.country,
            usercountry: extractCountry(req).country,
            page: page,
            pageSize: 25
        }, function(err, docs) {
            if (err) {
                return janitor.error(res, err);
            }
            res.render('documents', {
                country: req.query.country,
                docs: docs,
                page: page,
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
            } else if (!req.user.admin && doc.username !== req.user.username) {
                return res.redirect('/');
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
            } else if (!req.user.admin && doc.username !== req.user.username) {
                return res.redirect('/');
            }
            res.render('document', {
                backButton: true,
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
        var doc = docs.validateAndBuild(req.body, req.assert),
            errors = req.validationErrors(),
            options;

        if (errors && errors.length) {
            return janitor.invalid(res, errors);
        }

        options = {
            username: req.user.username,
            data: _.extend(doc, extractCountry(req))
        };

        docs.insert(options, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/documents');
        });
    },
    updateDoc: function(req, res) {
        var id = req.params.id,
            data = docs.validateAndBuild(req.body, req.assert),
            errors = req.validationErrors();

        if (errors && errors.length) {
            return janitor.invalid(res, errors);
        }

        docs.get({
            id: id
        }, function(err, doc) {
            if (!req.user.admin) {
		delete data.comments_public;
            }
            if (err || !doc) {
                return janitor.error(res, err || 'Invalid document.');
            } else if (!req.user.admin && doc.username !== req.user.username) {
                return janitor.error(res, "Unable to update document.");
            }

            docs.update({
                data: data,
                id: id,
                resetApproved: !req.user.admin
            }, function(err) {
                if (err) {
                    return janitor.error(res, err);
                }

                res.redirect('/documents/' + id);
            });
        });
    },
    changeApproval: function(req, res, approval) {
        var id = req.params.id;

        docs.get({
            id: id
        }, function(err, doc) {
            if (err || !doc) {
                return janitor.error(res, err || 'Invalid document.');
            }

            docs.update({
                data: {
                    approved: approval
                },
                id: id
            }, function(err) {
                if (err) {
                    return janitor.error(res, err);
                }

                res.redirect('/documents/' + id);
            });
        });
    },
    approveDoc: function(req, res) {
        module.exports.changeApproval(req, res, true);
    },
    rejectDoc: function(req, res) {
        module.exports.changeApproval(req, res, false);
    }
};

function extractCountry(req) {
    var countryTokens = (req.user.country || '').split(' - ');

    return {
        country: countryTokens[1] || '',
        countryCode: countryTokens[0] || '',
    };
}
