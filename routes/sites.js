var db = require('../lib/db'),
    isAuthenticated = require('../lib/auth'),
    janitor = require('../lib/janitor'),
    sites = require('../lib/sites'),
    users = require('../lib/users');

module.exports = {
    init: function(app) {
        app.get('/sites', isAuthenticated, module.exports.showSites);
        app.get('/sites/new', isAuthenticated, module.exports.newSite);

        app.post('/sites', isAuthenticated, module.exports.createSite);
        app.post('/sites/:username/:created_at/remove', isAuthenticated, module.exports.removeSite);
    },
    /**
     * Show the list of sites for the logged in user, or *all* sites if admin.
     */
    showSites: function(req, res) {
        sites.list({
            isAdmin: req.user.admin,
            username: req.user.username
        }, function(err, sites) {
            res.render('sites', {
                sites: sites,
                title: 'Sites'
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
        var options = {
            url: req.body.url
        };

        if (req.user.admin) {
            options.username = req.body.username;
        } else {
            options.username = req.user.username;
        }
        sites.insert(options, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/sites');
        })
    },
    removeSite: function(req, res) {
        sites.remove({
            username: req.params.username,
            created_at: req.params.created_at
        }, function(err) {
            if (err) {
                return janitor.error(res, err);
            }

            res.redirect('/sites');
        });
    }
};

