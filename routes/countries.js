var countries = require('../lib/countries'),
    janitor = require('../lib/janitor');

module.exports = {
  init: function(app) {
    app.get('/countries', module.exports.showCountries);
    app.get('/country/:code.:format?', module.exports.getCountry);
  },

  showCountries: function(req, res) {
    countries.list(function (err, theCountries) {
      if (err) {
        return janitor.error(res, err);
      }
      res.send(theCountries);
    });
  },

  getCountry: function(req, res) {
    var code = req.params.code;
    countries.get({ country_code: code }, function(err, country) {
      if (err) {
        return janitor.error(res, err);
      } else if (!country) {
        return janitor.missing(res);
      }
      res.send(country);
    });
  },
};
