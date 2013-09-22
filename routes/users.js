var db = require('../lib/db'),
    users = require('../lib/users'),
    sites = require('../lib/sites'),
    passport = require('passport');

module.exports = {
    init: function(app) {
        app.post('/logout', module.exports.doLogout);

        app.get('/login', module.exports.showLogin);
        app.get('/sites', isAuthenticated, module.exports.showSites);

        app.post('/login', passport.authenticate('local', {
            failureRedirect: '/login',
            successRedirect: '/'
        }));
    },
    /**
     * Show the login page. Redirects to /setup if no users at all.
     */
    showLogin: function(req, res) {
        users.isEmpty(function(err, empty) {
            if (empty) {
                res.redirect('/setup');
            } else {
                res.render('login', {
                    isLogin: true,
                    title: 'Login'
                });
            }
        });
    },
    showSites: function(req, res) {
        sites.list({}, function(err, sites) {
            res.render('sites', {
                sites: sites,
                title: 'Sites'
            });
        });
    },
    doLogout: function(req, res, next) {
        req.logout();
        res.redirect('/');
    },
    validate: function(user) {
        var errors = [];

        if (!user.username) {
            errors.push("Username required");
        }
        if (!user.password) {
            errors.push("Password required");
        } else if (user.password.length < 8) {
            errors.push("Password must be at least 8 characters long");
        } else if (user.password !== user.confirm) {
            errors.push("Password and confirmation do not match");
        }

        return errors;
    }
};

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/');
    }
}
