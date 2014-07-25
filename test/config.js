var config = require('../lib/config');

exports['invalid if nothing'] = function(test) {
    test.equals(config.valid({}), false);

    test.done();
};

exports['valid if all supplied'] = function(test) {
    test.equals(config.valid({
        DB_PATH: 'x',
        COOKIE_SECRET: 'x',
        SESSION_SECRET: 'x'
    }), true);

    test.done();
};
