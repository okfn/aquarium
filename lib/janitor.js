var _ = require('underscore');

module.exports = {
    error: function(res, err) {
        res.status(500).render('500', {
            err: err,
            title: "Error"
        });
    },
    invalid: function(res, errors) {
        var messages = _.map(errors, function(error) {
            return error.msg;
        });

        res.send(403, messages.join(', '));
    },
    missing: function(res) {
        res.status(404).render('404', {
            cls: 'missing',
            title: 'Not found'
        });
    }
};
