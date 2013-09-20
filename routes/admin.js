var janitor = require('../lib/janitor'),
    users = require('../lib/users');

module.exports = {
    init: function(app) {
        app.get('/dashboard', isAdmin, module.exports.index);
        app.get('/users/new', isAdmin, module.exports.showNewUser);

        app.post('/users', isAdmin, module.exports.addNewUser);
    },
    /*
     * Shows the list of users to the admin. Redirects to / if not admin user.
     */
    index: function(req, res) {
        users.count(function(err, count) {
            if (err) {
                return janitor.error(res, err);
            }

            res.render('dashboard', {
                countryCount: 0,
                pageCount: 0,
                userCount: count,
                title: 'Admin Dashboard',
                user: req.user
            });
        });
    },
    showNewUser: function(req, res) {
        res.render('newuser', {
            title: 'New User',
            user: req.user
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
