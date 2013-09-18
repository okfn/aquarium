var _ = require('underscore'),
    fs = require('fs'),
    properties = require('properties');

module.exports = {
    /**
     *  Config is valid if process.env has: DB_NAME, DB_HOST, DB_PORT
     *
     *  @param {Object} [obj] Optional config object; defaults to `process.env`
     */
    valid: function(obj) {
        if (!obj) {
            obj = module.exports;
        }
        return _.all(['DB_PATH'], function(key) {
            return !!obj[key];
        });
    }
}

try {
    // read the .env file and apply it to module.exports
    _.extend(module.exports, properties.parse(fs.readFileSync('.env', 'utf8')));
} catch(e) {
    console.log(e);
    // do nothing; this is normal in production
}
