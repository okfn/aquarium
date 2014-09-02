/* globals require */
var $ = require('jquery-browserify'),
    serializer = require('serialize-form').serializeFormObject,
    Validator = require('./validator-min').Validator;

require('./bootstrap-datepicker');
require('./jquery-fns');
require('bootstrap-browserify');

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

function checkErrors(el, validator) {
    var $el = $(el),
        errors = validator.getErrors();

    if (errors.length) {
        $el.find('[type=submit]').disable();
        $el.find('.errors').html(errors.join('<br/>')).removeClass('hidden');
    } else {
        $el.find('[type=submit]').enable();
        $el.find('.errors').addClass('hidden');
    }
}

$(document).on('input', 'form#newuser', function() {
    var values = serializer('form#newuser'),
        validator;

    validator = new Validator();
    validator.check(values.username, 'Username must be an email.').isEmail();
    validator.check(values.password, 'Password must be 8 characters or more.').len(8);
    validator.check(values.confirm, 'Passwords must match.').equals(values.password);

    checkErrors(this, validator);
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
    var values = serializer('form#login'),
        validator;

    validator = new Validator();
    validator.check(values.username, 'Username must be an email.').isEmail();
    validator.check(values.password, 'Password must be 8 characters or more.').len(8);

    checkErrors(this, validator);
});

$(document).on('input', 'form#setup', function() {
    var values = serializer('form#setup'),
        validator;

    validator = new Validator();
    validator.check(values.username, 'Username must be an email.').isEmail();
    validator.check(values.password, 'Password must be 8 characters or more.').len(8);
    validator.check(values.confirm, 'Passwords must match.').equals(values.password);

    checkErrors(this, validator);
});

function validateDoc(id) {
    return function() {
        var values = serializer(id),
            validator;

        validator = new Validator();
        validator.check(values.title, 'Document must have a title.').notEmpty();

        checkErrors(this, validator);
    };
}

$(document).on('input', 'form#newdoc', validateDoc('form#newdoc'));
$(document).on('input', 'form#editdoc', validateDoc('form#editdoc'));

$(document).on('input', 'form#newsite', function() {
    var values = serializer('form#newsite'),
        validator;

    validator = new Validator();
    validator.check(values.title, 'Must have title').notEmpty();

    checkErrors(this, validator);
});

$(document).on('input', 'form#newreport', function() {
    var values = serializer('form#newreport'),
        validator;

    validator = new Validator();
    validator.check(values.content, 'Must have content').notEmpty();

    checkErrors(this, validator);
});

$(document).ready(function() {
    $('[name=date]').each(function(i) {
        var field = $(this);
        field.datepicker().on('changeDate', function() {
            $(this).next().find('[type=submit]').enable();
        }).on('clearDate', function() {
            $(this).next().find('[type=submit]').disable();
        }).datepicker('setStartDate', field.attr('data-start') ? 
                      new Date(field.attr('data-start')) : new Date());
    });
});

// handle clicks on the + button of sites
$(document).on('click', '.add-date', function(e) {
    $(e.target).prev('input').datepicker('show');
});

// handle clicks on the 'add input' button of document submission
$(document).on('click', '.add-input', function(e) {
    var target = $(e.target);
    var input_field = $('<input type="text">')
        .attr('autocomplete', 'off')
        .attr('name', target.attr('data-name'))
        .addClass('form-control')
    target.before(input_field);

    return false;
});

$(document).on('submit', 'form.confirm', function(e) {
    var $target = $(e.currentTarget),
        message = $target.find('.confirm-text').text(),
        result;

    e.preventDefault();

    result = confirm(message);

    if (result) {
        $.ajax({
            url: $target.attr('action'),
            type: $target.attr('method'),
            complete: function() {
                window.location = '/researchers';
            }
        });
    }
});
