var passport = require('passport');

/*
 * GET home page.
*/

exports.index = function(req, res, next){
    res.render('index', {
        title: 'Aquarium',
        user: req.user
    });
};
