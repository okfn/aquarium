var db = require('../lib/db'),
    janitor = require('../lib/janitor'),
    docs = require('../lib/documents');

module.exports = {
    init: function(app) {
        app.get('/overview', module.exports.overview);
    },
    overview: function(req, res) {
        docs.overview(function(err, countries) {
            res.render('overview', {
                countries: countries,
                title: 'Overview'
            });
        });
    }
};
