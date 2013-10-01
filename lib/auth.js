module.exports = {
    admin: function(req, res, next) {
        if (req.isAuthenticated() && req.user && req.user.admin) {
            next();
        } else {
            res.redirect('/');
        }
    },
    authenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.redirect('/');
        }
    }
}
