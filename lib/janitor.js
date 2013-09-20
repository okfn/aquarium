module.exports = {
    error: function(res, err) {
        res.render('500', {
            err: err,
            title: "Error"
        });
    }
};
