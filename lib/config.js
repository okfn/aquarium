var _ = require('underscore'),
    fs = require('fs'),
    properties = require('properties'),
    keys = ['DB_PATH', 'COOKIE_SECRET', 'SESSION_SECRET'];

module.exports = {
    /**
     *  Config is valid if module.exports has everything in the keys array
     *
     *  @param {Object} [obj] Optional config object; defaults to `module.exports`
     */
    valid: function(obj) {
        if (!obj) {
            obj = module.exports;
        }
        return _.all(keys, function(key) {
            return !!obj[key];
        });
    }
}

_.extend(module.exports, _.pick(process.env, keys));

if (!module.exports.valid()) {
    try {
        // read the .env file and apply it to module.exports
        _.extend(module.exports, properties.parse(fs.readFileSync('.env', 'utf8')));
    } catch(e) {
        // do nothing; this is normal in production
    }
}
