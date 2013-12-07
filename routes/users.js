var users = require('../lib/users'),
    janitor = require('../lib/janitor'),
    passport = require('passport');

module.exports = {
    init: function(app) {
        app.post('/logout', module.exports.doLogout);

        app.get('/login', module.exports.showLogin);
        app.get('/users/:id', module.exports.editUser);

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
    doLogout: function(req, res) {
        req.logout();
        res.redirect('/');
    },
    editUser: function(req, res) {
        users.getUserById(req.params.id, function(err, user) {
            if (err) {
                return janitor.error(res, err);
            }
            res.render('user', {
                user: user,
                title: user.username
            });
        });
    }
};
