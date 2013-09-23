var db = require('../lib/db'),
    janitor = require('../lib/janitor'),
    sites = require('../lib/sites');

module.exports = {
    init: function(app) {
        app.get('/sites', isAuthenticated, module.exports.showSites);
        app.get('/sites/new', isAuthenticated, module.exports.newSite);

        app.post('/sites', isAuthenticated, module.exports.createSite);
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
        res.render('newsite', {
            title: 'Sites'
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
    }
};

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/');
    }
}

