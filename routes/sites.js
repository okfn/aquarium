var db = require('../lib/db'),
    auth = require('../lib/auth'),
    janitor = require('../lib/janitor'),
    sites = require('../lib/sites'),
    users = require('../lib/users');

module.exports = {
    init: function(app) {
        app.get('/sites', auth.authenticated, module.exports.showSites);
        app.get('/sites/new', auth.authenticated, module.exports.newSite);

        app.post('/sites', auth.authenticated, module.exports.createSite);
        app.post('/sites/:username/:created_at/remove', auth.authenticated, module.exports.removeSite);
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
            title: req.body.title,
            type: req.body.type,
            url: req.body.url,
            username: req.user.username
        };

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

