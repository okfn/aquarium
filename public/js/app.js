/* globals require */
var $ = require('./jquery-2.0.3.min'),
    serializer = require('serialize-form').serializeFormObject,
    Validator = require('./validator-min').Validator;

require('./bootstrap-datepicker');
require('./jquery-fns');
require('./bootstrap');

Validator.prototype.error = function (msg) {
    this._errors.push(msg);
    return this;
};

Validator.prototype.getErrors = function () {
    return this._errors;
};


$(document).on('click', 'form#newuser [name=admin]', function() {
    $('form#newuser [name=country]').enable(!this.checked);
});

$(document).on('input', 'form#newuser', function() {
    var $this = $(this),
        values = serializer('form#newuser'),
        errors,
        validator;

    validator = new Validator();
    validator.check(values.username, 'Username must be an email.').isEmail();
    validator.check(values.password, 'Password must be 8 characters or more.').len(8);
    validator.check(values.confirm, 'Passwords must match.').equals(values.password);

    errors = validator.getErrors();

    if (errors.length) {
        $this.find('[type=submit]').disable();
        $this.find('.errors').html(errors.join('<br/>')).removeClass('hidden');
    } else {
        $this.find('[type=submit]').enable();
        $this.find('.errors').addClass('hidden');
    }
});

$(document).on('change', 'form#country select', function() {
    var country,
        value = $(this).val();

    if (value === '*') {
        window.location = '/documents';
    } else {
        country = value.split(' - ')[1];
        window.location = '/documents?country=' + country;
    }
});

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

$(document).on('input', 'form#newsite', function() {
    var $this = $(this),
        values = serializer('form#newsite'),
        errors,
        validator;

    validator = new Validator();
    validator.check(values.title, 'Must have title').notEmpty();

    errors = validator.getErrors();

    if (errors.length) {
        $this.find('[type=submit]').disable();
        $this.find('.errors').html(errors.join(',')).removeClass('hidden');
    } else {
        $this.find('[type=submit]').enable();
        $this.find('.errors').addClass('hidden');
    }
});

$(document).on('input', 'form#newreport', function() {
    var $this = $(this),
        values = serializer('form#newreport'),
        errors,
        validator;

    validator = new Validator();
    validator.check(values.content, 'Must have content').notEmpty();

    errors = validator.getErrors();

    if (errors.length) {
        $this.find('[type=submit]').disable();
        $this.find('.errors').html(errors.join(',')).removeClass('hidden');
    } else {
        $this.find('[type=submit]').enable();
        $this.find('.errors').addClass('hidden');
    }
});

$(document).ready(function() {
    $('[name=publication_date]').datepicker().on('changeDate', function() {
        $(this).next().find('[type=submit]').enable();
    }).on('clearDate', function() {
        $(this).next().find('[type=submit]').disable();
    }).datepicker('setStartDate', new Date());
});
