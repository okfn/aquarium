var db = require('../lib/db');

/**
 * Show the login page. Redirects to /setup if no users at all.
 */
exports.login = function(req, res) {
    var accounts = db.coll("accounts");

    accounts.count(function(err, count) {
        if (count === 0) {
            res.redirect('/setup');
        } else {
            res.render('login', {
                title: 'Login'
            });
        }
    });
};

exports.setup = function(req, res) {
    var accounts = db.coll("accounts");

    accounts.count(function(err, count) {
        if (count === 0) {
            res.render('setup', {
                title: 'Admin User Setup'
            });
        } else {
            res.redirect('/login');
        }
    });
}
