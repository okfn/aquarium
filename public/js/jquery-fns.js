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
