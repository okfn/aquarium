var config = require('../lib/config'),
    db = require('../lib/db'),
    sinon = require('sinon');

exports['init with nothing configured errors'] = function(test) {
    sinon.stub(config, 'valid').returns(false);

    db.init(function(err) {
        test.equals(err, "Set valid DB variables in the .env file.");

        config.valid.restore();

        test.done();
    });
}

exports['init with running configured mongo works'] = function(test) {
    db.init(function(err) {
        test.equals(err, undefined);
        db.close();
        test.done();
    });
}
