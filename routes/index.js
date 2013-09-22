var passport = require('passport');

/*
 * GET home page.
*/

module.exports = {
    init: function(app) {
        app.get('/', module.exports.index);
    },
    index: function(req, res) {
        res.render('index', {
            title: 'Aquarium',
            user: req.user
        });
    }
};
