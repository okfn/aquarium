var _ = require('underscore'),
    async = require('async'),
    auth = require('../lib/auth'),
    csv = require('csv'),
    janitor = require('../lib/janitor'),
    users = require('../lib/users'),
    moment = require('moment'),
    docs = require('../lib/documents'),
    sites = require('../lib/sites');

module.exports = {
    init: function(app) {
        app.get('/dashboard', auth.admin, module.exports.index);
        app.get('/setup', module.exports.showSetup);
        app.get('/users', auth.admin, module.exports.listUsers);
        app.get('/users/new', auth.admin, module.exports.showNewUser);
        app.get('/export', auth.admin, module.exports.dataExport);

        app.post('/setup', module.exports.createAdmin);
        app.post('/users', auth.admin, module.exports.addNewUser);
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
    dataExport: function(req, res) {
        docs.list({
            admin: true
        }, function(err, docs) {
            var stream;

            res.writeHead(200, {
                'Content-disposition': 'attachment;filename=export-' + moment().format('YYYY-MM-DD') + '.csv',
                'Content-Type': 'text/csv'
            });
            stream = csv().to.stream(res, {
                columns: ['type', 'title', 'country', 'url', 'location', 'location_detail', 'username', 'date_published', 'date_received', 'softcopy', 'scanned', 'approved', 'available', 'comments'],
                header: true
            }).transform(function(row) {
                row.approved = row.approved ? 'yes' : 'no';
                row.available = row.available ? 'yes' : 'no';
                row.softcopy = row.softcopy ? 'yes' : 'no';
                row.scanned = row.scanned ? 'yes' : 'no';

                return row;
            });
            _.each(docs, function(doc) {
                stream.write(doc);
            });
            res.end();
        });
    },
    validate: function(obj) {
        return [];
    }
};
