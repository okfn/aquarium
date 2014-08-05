var countries = require('../lib/countries'),
    janitor = require('../lib/janitor');

module.exports = {
  init: function(app) {
    app.get('/countries', module.exports.showCountries);
  },

  showCountries: function(req, res) {
    countries.list(function (err, theCountries) {
      if (err) {
        return janitor.error(res, err);
      }
      res.send(theCountries);
    });
  }
};
