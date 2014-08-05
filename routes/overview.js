var janitor = require('../lib/janitor'),
    overview = require('../lib/overview');

module.exports = {
    init: function(app) {
        app.get('/overview.:format?', module.exports.overview);
    },
    overview: function(req, res) {
        overview.getGrid(function(err, grid) {
            function respondWithHTML() {
              res.render('overview', {
                  grid: grid,
                  title: 'Overview'
              });
            }
            function respondWithJSON() {
              res.send(grid);
            }

            if (err) {
                return janitor.error(res, err);
            }

            var format = req.params.format;
            if (format && format.toLowerCase() == 'json') {
              respondWithJSON();
            } else {
              res.format({
                html: respondWithHTML,
                json: respondWithJSON,
              });
            }
        });
    }
};
