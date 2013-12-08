var reports = require('../lib/reports'),
    markdown = require('markdown').markdown,
    auth = require('../lib/auth'),
    moment = require('moment'),
    _ = require('underscore'),
    _s = require('underscore.string'),
    janitor = require('../lib/janitor');

module.exports = {
    /**
     * Add routes the app.
     */
    init: function(app) {
        app.get('/reports', auth.authenticated, module.exports.showReports);
        app.get('/reports/new', auth.authenticated, module.exports.newReport);
        app.get('/reports/:id', auth.authenticated, module.exports.showReport);

        app.post('/reports', auth.authenticated, module.exports.createReport);
    },
    /**
     * Show list of reports for current user or, if admin, all reports
     */
    showReports: function(req, res) {
        var query = {};

        if (req.user.admin) {
            query.admin = true;
        } else {
            query.user_id = req.user._id;
        }
        reports.list(query, function(err, reports) {
            if (err) {
                return janitor.error(res, err);
            }

            reports = _.map(reports, function(report) {
                return module.exports.mapReport(report);
            });

            res.render('reports', {
                reports: reports,
                title: 'Monthly Reports'
            });
        });
    },
    mapReport: function(report) {
        return {
            _id: report._id,
            content: markdown.toHTML(report.content),
            month: moment(report.created_at).format('MMM YYYY'),
            lede: _s.prune(report.content, 140),
            username: report.username,
            user_id: report.user_id
        }
    },
    /**
     * Show a single report if admin or if authored it.
     */
    showReport: function(req, res) {
        reports.get({
            id: req.params.id
        }, function(err, report) {
            if (err) {
                return janitor.error(res, err);
            } else if (!req.user.admin && report.user_id.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }

            res.render('report', {
                report: module.exports.mapReport(report),
                title: 'Report'
            });
        });
    },
    /**
     * Show the screen to add a new report
     */
    newReport: function(req, res) {
        res.render('newreport', {
            title: 'Create New Report'
        });
    },
    /**
     * Create report from post
     */
    createReport: function(req, res) {
        var errors;

        req.assert('content', 'Must have content in report.').notEmpty();

        errors = req.validationErrors();

        if (errors && errors.length) {
            return janitor.invalid(res, errors);
        }

        reports.insert({
            content: req.body.content,
            user_id: req.user._id,
            username: req.user.username
        }, function(err) {
            if (err) {
                return janitor.invalid(res, err);
            }

            res.redirect('/reports');
        });
    }
};
