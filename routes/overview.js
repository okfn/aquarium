var db = require('../lib/db'),
    janitor = require('../lib/janitor'),
    docs = require('../lib/documents');

module.exports = {
    init: function(app) {
        app.get('/pulse', module.exports.pulse);
    },
    pulse: function(req, res) {
        docs.pulse(function(err, countries) {
            res.render('pulse', {
                countries: countries,
                title: 'Overview'
            });
        });
    }
};
