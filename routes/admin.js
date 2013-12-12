var async = require('async'),
    auth = require('../lib/auth'),
    exporter = require('../lib/exporter'),
    janitor = require('../lib/janitor'),
    users = require('../lib/users'),
    moment = require('moment'),
    docs = require('../lib/documents'),
    sites = require('../lib/sites');

module.exports = {
    init: function(app) {
        app.get('/dashboard', auth.admin, module.exports.index);
        app.get('/setup', module.exports.showSetup);
        app.get('/researchers', auth.admin, module.exports.listUsers);
        app.get('/researchers/new', auth.admin, module.exports.showNewUser);
        app.get('/export', auth.admin, module.exports.dataExport);

        app.post('/setup', module.exports.createAdmin);
        app.post('/researchers', auth.admin, module.exports.addNewUser);
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
                errors;

            if (empty) {
                req.assert('username', 'Username required.').isEmail();
                req.assert('password', 'Password must be at least eight characters long.').len(8);

                errors = req.validationErrors();

                if (!errors || errors.length === 0) {
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
                            req.logIn(user, function(err) {
                                if (err) {
                                    res.send(500, err);
                                } else {
                                    res.redirect('/');
                                }
                            });
                        }
                    });
                } else {
                    janitor.invalid(res, errors);
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
        async.map([users.count, docs.countUnapproved, docs.count, sites.count], function(fn, callback) {
            fn({}, callback);
        }, function(err, results) {
            if (err) {
                return janitor.error(res, err);
            }

            res.render('dashboard', {
                documentCount: results[2],
                unapprovedCount: results[1],
                pageCount: results[3],
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
            errors;

        req.assert('username', 'Username required.').isEmail();
        req.assert('password', 'Password must be at least eight characters long.').len(8);

        errors = req.validationErrors();

        if (!errors || errors.length === 0) {
            users.insert({
                password: password,
                user: {
                    admin: req.body.admin,
                    country: req.body.country,
                    name: req.body.name,
                    sites: [],
                    username: req.body.username
                }
            }, function(err) {
                if (err) {
                    janitor.error(res, err);
                } else {
                    res.redirect('/dashboard');
                }
            });
        } else {
            janitor.invalid(res, errors);
        }
    },
    dataExport: function(req, res) {
        exporter.generateZip(function(err, data) {
            if (err) {
                return janitor.error(res, err);
            }

            res.writeHead(200, {
                'Content-disposition': 'attachment;filename=export-' + moment().format('YYYY-MM-DD-HH-MM') + '.zip',
                'Content-Type': 'application/zip'
            });
            res.end(new Buffer(data, 'base64'))
        });
    }
};
