var _ = require('underscore'),
    async = require('async'),
    csv = require('json2csv'),
    docs = require('./documents'),
    reports = require('./reports'),
    sites = require('./sites'),
    JSZip = require('node-zip');

module.exports = {
    generateZip: function(callback) {
        async.parallel({
            docs: module.exports.getDocs,
            sites: module.exports.getSites,
            reports: module.exports.getReports
        }, function(err, results) {
            var data,
                zip;

            if (err) {
                return callback(err);
            }

            zip = new JSZip();

            _.each(results, function(data, key) {
                zip.file(key + '.csv', data);
            });

            data = zip.generate({
                base64: true,
                compression: 'DEFLATE'
            });
            callback(null, data);
        });
    },
    mapRows: function(rows) {
        return _.map(rows, function(row) {
            _.each(row, function(val, key) {
                if (val === true) {
                    row[key] = 'yes';
                } else if (val === false) {
                    row[key] = 'no';
                }
            });

            return row;
        });
    },
    getDocs: function(callback) {
        docs.list({
            admin: true
        }, function(err, docs) {
            if (err) {
                return callback(err);
            }
            csv({
                data: module.exports.mapRows(docs),
                fields: [
                    'type',
                    'title',
                    'country',
                    'url',
                    'location',
                    'location_detail',
                    'username',
                    'date_published',
                    'date_received',
                    'softcopy',
                    'scanned',
                    'approved',
                    'available',
                    'comments'
                ]
            }, callback);
        });
    },
    getSites: function(callback) {
        sites.listAll(function(err, sites) {
            var data;

            if (err) {
                return callback(err);
            }

            data = module.exports.mapRows(sites);

            // extract dates
            _.each(data, function(row) {
                row.search_dates = [
                    row.search_dates.start.toISOString(),
                    row.search_dates.end.toISOString()].join(' - ');
            });

            csv({
                data: data,
                fields: [
                    'active',
                    'created_at',
                    'country',
                    'title',
                    'type',
                    'username',
                    'url',
                    'search_dates'
                ]
            }, callback);
        });
    },
    getReports: function(callback) {
        reports.list({
            admin: true
        }, function(err, data) {
            if (err) {
                return callback(err);
            }

            csv({
                data: data,
                fields: ['created_at', 'content', 'username']
            }, callback);
        });
    }
};
