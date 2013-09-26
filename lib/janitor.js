module.exports = {
    error: function(res, err) {
        res.status(500).render('500', {
            err: err,
            title: "Error"
        });
    },
    missing: function(res) {
        res.status(404).render('404', {
            cls: 'missing',
            title: 'Not found'
        });
    }
};
