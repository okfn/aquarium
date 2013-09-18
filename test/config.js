var config = require('../lib/config');

exports['invalid if nothing'] = function(test) {
    test.equals(config.valid({}), false);

    test.done();
}

exports['valid if all supplied'] = function(test) {
    test.equals(config.valid({
        DB_NAME: 'x',
        DB_HOST: 'x',
        DB_PORT: 'x'
    }), true);

    test.done();
}
