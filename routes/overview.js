var janitor = require('../lib/janitor'),
    overview = require('../lib/overview');

module.exports = {
    init: function(app) {
        app.get('/overview', module.exports.overview);
    },
    overview: function(req, res) {
        overview.getGrid(function(err, grid) {
            if (err) {
                return janitor.error(res, err);
            }

            res.format({
              html: function() {
                res.render('overview', {
                    grid: grid,
                    title: 'Overview'
                });
              },
              json: function() {
                res.send(grid);
              }
            });
        });
    }
};
