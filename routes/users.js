var db = require('../lib/db'),
    users = require('../lib/users'),
    passport = require('passport');

module.exports = {
    init: function(app) {
        app.post('/logout', module.exports.doLogout);

        app.get('/login', module.exports.showLogin);

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
    doLogout: function(req, res, next) {
        req.logout();
        res.redirect('/');
    }
};
