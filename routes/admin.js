var db = require('../lib/db');

module.exports = {
    init: function(app) {
        app.get('/dashboard', isAdmin, module.exports.index);
        app.get('/users/new', isAdmin, module.exports.showNewUser);
    },
    /*
     * Shows the list of users to the admin. Redirects to / if not admin user.
     */
    index: function(req, res) {
        res.render('dashboard', {
            title: 'Admin Dashboard',
            user: req.user
        });
    },
    showNewUser: function(req, res) {
        res.render('newuser', {
            title: 'New User',
            user: req.user
        });
    }
};

function isAdmin(req, res, next) {
    if (req.user && req.user.admin) {
        next();
    } else {
        res.redirect('/');
    }
}
