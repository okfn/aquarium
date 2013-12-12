/*
 * GET home page.
*/

module.exports = {
    init: function(app) {
        app.get('/', module.exports.index);
    },
    index: function(req, res) {
        res.render('index', {
            title: "IBP's Open Budget Tracker",
            user: req.user
        });
    }
};
