var _ = require('underscore'),
    properties = require('properties');

try {
    // read the .env file and apply it to process.env
    _.extend(process.env, properties.parse(fs.readFileSync('.env', 'utf8')));
} catch(e) {
    // do nothing; this is normal in production
}

module.exports = {
    /**
     *  Config is valid if process.env has: DB_NAME, DB_HOST, DB_PORT
     *
     *  @param {Object} [obj] Optional config object; defaults to `process.env`
     */
    valid: function(obj) {
        if (!obj) {
            obj = process.env;
        }
        return _.all(['DB_NAME', 'DB_HOST', 'DB_PORT'], function(key) {
            return !!obj[key];
        });
    }
}
