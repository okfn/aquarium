var auth = require('../lib/auth'),
    janitor = require('../lib/janitor'),
    sites = require('../lib/sites'),
    users = require('../lib/users'),
    moment = require('moment'),
    _s = require('underscore.string');

module.exports = {
    init: function(app) {
        app.get('/tracking', auth.authenticated, module.exports.showSites);
        app.get('/tracking/new', auth.authenticated, module.exports.newSite);

        app.post('/tracking', auth.authenticated, module.exports.createSite);
        app.post('/tracking/:username/:created_at/add-date', auth.authenticated, module.exports.addDate);
        app.post('/tracking/:username/:created_at/delete-date', auth.authenticated, module.exports.deleteDate);
        app.post('/tracking/:username/:created_at/disable', auth.authenticated, module.exports.disable);
        app.post('/tracking/:username/:created_at/enable', auth.authenticated, module.exports.enable);
        app.post('/tracking/:username/:created_at/remove', auth.authenticated, module.exports.remove);
    },
    // Show the list of sites for the logged in user, or *all* sites if admin.
    showSites: function(req, res) {
        var search = _s.trim(req.query.q);

        sites.list({
            isAdmin: req.user.admin,
            username: req.user.username,
            search: search
        }, function(err, result) {
            res.render('sites', {
                search: search,
                sites: result.items,
                title: 'Tracking',
                total: result.total
            });
        });
    },
    // Show the page with form to add a new site.
    newSite: function(req, res) {
        users.list(function(err, users) {
            if (err) {
                return janitor.error(res, err);
            }
            res.render('newsite', {
                title: 'Track New Document',
                users: users
            });
        });
    },
    // Create a site
    createSite: function(req, res) {
        var errors,
            options;

        options = {
            publication_dates: [],
            title: req.body.title,
            type: req.body.type,
            url: req.body.url || null,
            username: req.user.username
        };

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

        errors = req.validationErrors();

        if (errors && errors.length) {
            return janitor.invalid(res, errors);
        }

        sites.insert(options, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/tracking');
        })
    },
    // enable a site; depends on created_at matching
    enable: function(req, res) {
        sites.enable({
            username: req.params.username,
            created_at: req.params.created_at
        }, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/tracking#site-' + req.body.index);
        });
    },
    // disable a site; depends on created_at matching
    disable: function(req, res) {
        sites.disable({
            username: req.params.username,
            created_at: req.params.created_at
        }, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/tracking#site-' + req.body.index);
        });
    },
    // remove a site; depends on created_at matching
    remove: function(req, res) {
        sites.remove({
            username: req.params.username,
            created_at: req.params.created_at
        }, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/tracking');
        });
    },
    // add a date to a site; depends on created_at matching
    addDate: function(req, res) {
        sites.addDate({
            created_at: req.params.created_at,
            publication_date: moment(req.body.publication_date).toDate(),
            username: req.params.username
        }, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/tracking#site-' + req.body.index);
        });
    },
    // delete a date from a site; depends on created_at matching
    deleteDate: function(req, res) {
        sites.deleteDate({
            created_at: req.params.created_at,
            publication_date: moment(req.body.publication_date).toDate(),
            username: req.params.username
        }, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/tracking#site-' + req.body.index);
        });
    }
};
