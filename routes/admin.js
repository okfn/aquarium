var async = require('async'),
    janitor = require('../lib/janitor'),
    users = require('../lib/users'),
    docs = require('../lib/documents');

module.exports = {
    init: function(app) {
        app.get('/dashboard', isAdmin, module.exports.index);
        app.get('/setup', module.exports.showSetup);
        app.get('/users', isAdmin, module.exports.listUsers);
        app.get('/users/new', isAdmin, module.exports.showNewUser);

        app.post('/setup', module.exports.createAdmin);
        app.post('/users', isAdmin, module.exports.addNewUser);
    },
    /**
     * Show the setup page. Redirects to /login if there are users.
     */
    showSetup: function(req, res) {
        users.isEmpty(function(err, empty) {
            if (empty) {
                res.render('setup', {
                    title: 'Admin User Setup'
                });
            } else {
                res.redirect('/login');
            }
        });
    },
    /**
     * Creates the admin user. 500s if there's already any user in the database.
     */
    createAdmin: function(req, res) {
        users.isEmpty(function(err, empty) {
            var user = req.body.username,
                pwd = req.body.password,
                errors = module.exports.validate(req.body);

            if (empty) {
                if (errors.length === 0) {
                    users.insert({
                        password: pwd,
                        user: {
                            admin: true,
                            username: user
                        }
                    }, function(err, user) {
                        if (err) {
                            res.send(500, err);
                        } else {
                            req.logIn(user, function(err, a, b) {
                                if (err) {
                                    res.send(500, err);
                                } else {
                                    res.redirect('/');
                                }
                            });
                        }
                    });
                } else {
                    res.send(403, errors.join(', '));
                }
            } else {
                res.send(500, "Admin user exists. Cannot overwrite.");
            }
        });
    },
    /*
     * Shows the list of users to the admin. Redirects to / if not admin user.
     */
    index: function(req, res) {
        async.map([users.count, docs.countUnapproved, docs.count], function(fn, callback) {
            fn({}, callback);
        }, function(err, results) {
            if (err) {
                return janitor.error(res, err);
            }

            res.render('dashboard', {
                documentCount: results[2],
                unapprovedCount: results[1],
                pageCount: 0,
                userCount: results[0],
                title: 'Admin Dashboard'
            });
        });
    },
    listUsers: function(req, res) {
        users.list(function(err, users) {
            if (err) {
                return janitor.error(res, err);
            }

            res.render('users', {
                title: 'User List',
                users: users
            });
        });
    },
    showNewUser: function(req, res) {
        res.render('newuser', {
            title: 'New User'
        });
    },
    addNewUser: function(req, res) {
        var password = req.body.password,
            errors = module.exports.validate(req.body);

        if (errors.length === 0) {
            users.insert({
                password: password,
                user: {
                    admin: false,
                    country: req.body.country,
                    name: req.body.name,
                    sites: [],
                    username: req.body.username
                }
            }, function(err, user) {
                if (err) {
                    janitor.error(res, err);
                } else {
                    res.redirect('/dashboard');
                }
            });
        } else {
            res.send(403, errors.join(', '));
        }
    },
    validate: function(obj) {
        return [];
    }
};

function isAdmin(req, res, next) {
    if (req.user && req.user.admin) {
        next();
    } else {
        res.redirect('/');
    }
}
