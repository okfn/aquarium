var users = require('../lib/users'),
    auth = require('../lib/auth'),
    janitor = require('../lib/janitor'),
    passport = require('passport');

module.exports = {
    init: function(app) {
        app.post('/logout', module.exports.doLogout);

        app.get('/login', module.exports.showLogin);
        app.get('/users/:id', auth.authenticated, module.exports.editUser);


        app.post('/login', passport.authenticate('local', {
            failureRedirect: '/login',
            successRedirect: '/'
        }));
        app.post('/users/:id', auth.authenticated, module.exports.updateUser);
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
            } else if (!req.user.admin && req.user.username !== user.username) {
                return janitor.error(res, "Unable to view user.");
            }
            res.render('user', {
                locales: global.locales,
                user: user,
                title: user.username
            });
        });
    },
    /**
     * Update user. If setting password need to match with current.
     */
    updateUser: function(req, res) {
        var data = module.exports.extractUser(req),
            errors = req.validationErrors(),
            id = req.params.id;

        if (errors && errors.length) {
            return janitor.invalid(res, errors);
        }

        users.getUserById(req.params.id, function(err, user) {
            if (err || !user) {
                return janitor.error(res, err || 'Invalid user');
            } else if (!req.user.admin && req.user.username !== user.username) {
                return janitor.error(res, "Unable to update user.");
            }

            users.updateUser({
                admin: req.user.admin,
                current: req.body.current,
                password: req.body.password,
                data: data,
                user: user,
                id: id
            }, function(err) {
                if (err) {
                    return janitor.error(res, err);
                }

                res.redirect('/users/' + id);
            });
        });
    },
    /**
     * Extract user details from the request. Validate.
     */
    extractUser: function(req) {
        req.assert('username', 'Username required.').isEmail();

        if (req.body.password) {
            req.assert('password', 'Password must be at least eight characters long.').len(8);
            req.assert('confirm', 'Passwords do not match.').equals(req.body.password);
        }

        return {
            locale: req.body.locale,
            username: req.body.username,
            name: req.body.name,
            mute: req.body.mute !== 'yes'
        };
    }
};
