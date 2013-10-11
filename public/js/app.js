var $ = require('./jquery-2.0.3.min'),
    serializer = require('serialize-form').serializeFormObject,
    Validator = require('./validator-min').Validator;

require('./jquery-fns');
require('./bootstrap');

Validator.prototype.error = function (msg) {
    this._errors.push(msg);
    return this;
};

Validator.prototype.getErrors = function () {
    return this._errors;
};

$(document).on('input', 'form#login', function() {
    var $this = $(this),
        values = serializer('form#login'),
        errors,
        validator;

    validator = new Validator();
    validator.check(values.username, 'Username must be an email.').isEmail();
    validator.check(values.password, 'Password must be 8 characters or more.').len(8);

    errors = validator.getErrors();

    if (errors.length) {
        $this.find('[type=submit]').disable();
    } else {
        $this.find('[type=submit]').enable();
    }
});

$(document).on('input', 'form#setup', function() {
    var $this = $(this),
        values = serializer('form#setup'),
        errors,
        validator;

    validator = new Validator();
    validator.check(values.username, 'Username must be an email.').isEmail();
    validator.check(values.password, 'Password must be 8 characters or more.').len(8);
    validator.check(values.confirm, 'Passwords must match.').equals(values.password);

    errors = validator.getErrors();

    if (errors.length) {
        $this.find('[type=submit]').disable();
    } else {
        $this.find('[type=submit]').enable();
    }
});

function validateDoc(id) {
    return function() {
        var $this = $(this),
            values = serializer(id),
            errors,
            validator;

        validator = new Validator();
        validator.check(values.title, 'Document must have a title.').notEmpty();

        errors = validator.getErrors();

        if (errors.length) {
            $this.find('[type=submit]').disable();
        } else {
            $this.find('[type=submit]').enable();
        }
    }
}

$(document).on('input', 'form#newdoc', validateDoc('form#newdoc'));
$(document).on('input', 'form#updatedoc', validateDoc('form#updatedoc'));
