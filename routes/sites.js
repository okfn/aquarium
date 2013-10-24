var db = require('../lib/db'),
    auth = require('../lib/auth'),
    janitor = require('../lib/janitor'),
    sites = require('../lib/sites'),
    users = require('../lib/users'),
    _s = require('underscore.string');

module.exports = {
    init: function(app) {
        app.get('/sites', auth.authenticated, module.exports.showSites);
        app.get('/sites/new', auth.authenticated, module.exports.newSite);

        app.post('/sites', auth.authenticated, module.exports.createSite);
        app.post('/sites/:username/:created_at/add-date', auth.authenticated, module.exports.addDate);
        app.post('/sites/:username/:created_at/disable', auth.authenticated, module.exports.disable);
        app.post('/sites/:username/:created_at/enable', auth.authenticated, module.exports.enable);
    },
    /**
     * Show the list of sites for the logged in user, or *all* sites if admin.
     */
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
                title: 'Sites',
                total: result.total
            });
        });
    },
    newSite: function(req, res) {
        users.list(function(err, users) {
            if (err) {
                return janitor.error(res, err);
            }
            res.render('newsite', {
                title: 'Sites',
                users: users
            });
        });
    },
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

            res.redirect('/sites');
        })
    },
    enable: function(req, res) {
        sites.enable({
            username: req.params.username,
            created_at: req.params.created_at
        }, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/sites');
        });
    },
    disable: function(req, res) {
        sites.disable({
            username: req.params.username,
            created_at: req.params.created_at
        }, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/sites');
        });
    },
    addDate: function(req, res) {
    }
};
