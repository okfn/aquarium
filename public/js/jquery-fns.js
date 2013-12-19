var $ = require('jquery-browserify');

$.fn.enable = function(flag) {
    if (arguments.length === 0) {
        this.removeAttr('disabled');
    } else {
        !!flag ? this.enable() : this.disable();
    }
    return this;
};

$.fn.disable = function() {
    this.attr('disabled', 'disabled');
    return this;
};

// bootstrap-browserify uses a version 2 of bootstrap
// so we need to toggle and fill in the input for button groups
$('.btn-group[data-toggle-target]').each(function() {
	var hidden = $('[name="' + $(this).attr('data-toggle-target') + '"]');
	$(this).on('click', '.btn', function() {
		hidden.val($(this).val());
	}).find('.btn').each(function() {
		$(this).toggleClass('active', $(this).val() == hidden.val())
	});
});
