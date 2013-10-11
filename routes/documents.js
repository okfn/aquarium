var _ = require('underscore'),
    db = require('../lib/db'),
    auth = require('../lib/auth'),
    janitor = require('../lib/janitor'),
    docs = require('../lib/documents');

module.exports = {
    init: function(app) {
        app.get('/documents', auth.authenticated, module.exports.showDocs);
        app.get('/documents/new', auth.authenticated, module.exports.newDoc);
        app.get('/documents/:id', auth.authenticated, module.exports.showDoc);
        app.get('/documents/:id/edit', auth.authenticated, module.exports.editDoc);

        app.post('/documents', auth.authenticated, module.exports.createDoc);
        app.post('/documents/:id', auth.authenticated, module.exports.updateDoc);

        app.post('/documents/:id/approve', auth.admin, module.exports.approveDoc);
        app.post('/documents/:id/reject', auth.admin, module.exports.rejectDoc);
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
        var doc = extractDoc(req),
            errors,
            options;

        errors = req.validationErrors();

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
            errors;

        errors = req.validationErrors();

        if (errors && errors.length) {
            return janitor.invalid(res, errors);
        }

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
    }
}

function extractDoc(req) {
    req.assert('type', 'Type must be valid.').isIn([
        "Pre-Budget Statement",
        "Executive's Budget Proposal",
        "Enacted Budget",
        "Citizen's Budget",
        "In-Year Report",
        "Mid-year Review",
        "Year-End Report",
        "Audit Report"
    ]);

    req.assert('title', 'Title can\'t be empty').notEmpty();
    req.assert('available', 'Available must be set').notEmpty();
    req.assert('location', 'Must specify location').notEmpty();
    req.assert('softcopy', 'Must specify softcopy').notEmpty();
    req.assert('scanned', 'Must specify scanned').notEmpty();

    return {
        type: req.body.type,
        title: req.body.title,
        available: req.body.available === 'yes',
        comments: req.body.comments,
        location: req.body.location,
        location_detail: req.body.location_detail,
        url: req.body.url,
        date_published: req.body.date_published,
        date_received: req.body.date_received,
        softcopy: req.body.softcopy === 'yes',
        scanned: req.body.scanned === 'yes'
    };
}
