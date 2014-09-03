var _ = require('underscore'),
    moment = require('moment'),
    db = require('./db');

module.exports = {
    list: function(options, callback) {
        var docs = db.coll('documents'),
            page = options.page || 1,
            pageSize = options.pageSize || 25,
            query = {};

        if (!options.admin) {
            query.username = options.username;
        }
        if (options.approved !== undefined) {
            query.approved = options.approved;
        }
        if (options.country) {
            query.country = options.country;
        }

        docs.find({
            $orderby: {
                created_at: -1,
                year: -1,
                approved: 1
            },
            $query: query
        }).limit(pageSize).skip((page - 1) * pageSize).toArray(callback);
    },
    listAll: function(callback) {
        var docs = db.coll('documents');

        docs.find({
            $query: {
              year: moment().year(),
            }
        }).toArray(callback);
    },
    exists: function(options, callback) {
        module.exports.get(options, function(err, doc) {
            callback(err, !!doc);
        });
    },
    get: function(options, callback) {
        var docs = db.coll('documents'),
            id = module.exports.getId(options);

        docs.findOne({
            _id: id
        }, callback);
    },
    count: function(options, callback) {
        var docs = db.coll('documents'),
            query = {};

        if (options.$query) {
            query = options.$query;
        }

        docs.count(query, callback);
    },
    countUnapproved: function(options, callback) {
        options.$query = {
            approved: {
                $ne: true
            }
        };
        module.exports.count(options, callback);
    },
    insert: function(options, callback) {
        var docs = db.coll('documents'),
            data = options.data,
            now = new Date();

        data.username = options.username;
        data.created_at = data.last_modified = now;

        docs.insert(data, callback);
    },
    validateAndBuild: function(reqBody, assert) {
      assert('type', 'Type must be valid.').isIn([
          "Pre-Budget Statement",
          "Executive's Budget Proposal",
          "Enacted Budget",
          "Citizen's Budget",
          "In-Year Report",
          "Mid-year Review",
          "Year-End Report",
          "Audit Report"
      ]);

      assert('title', 'Title can\'t be empty').notEmpty();

      var dateFormat = 'DD MMM YYYY',
          expectedDatePublished = moment(reqBody.expected_date_published, dateFormat),
          datePublished = moment(reqBody.date_published, dateFormat),
          dateReceived = moment(reqBody.date_received, dateFormat);
      if (expectedDatePublished) {
        assert('expected_date_published',
               'Expected date of publication should be in format 01 Jan 2014')
          .isValidDate();
      }
      if (datePublished) {
        assert('date_published',
               'Date of publication should be in format 01 Jan 2014')
          .isValidDate();
      }
      if (dateReceived) {
        assert('date_received',
               'Date received should be in format 01 Jan 2014')
          .isValidDate();
      }

      return {
          type: reqBody.type,
          title: reqBody.title,
          available: reqBody.available === 'yes',
          year: parseInt(reqBody.year, 10) || undefined,
          comments: reqBody.comments,
          location: reqBody.location || '',
          location_detail: reqBody.location_detail,
          url: reqBody.url,
          expected_date_published: expectedDatePublished,
          date_published: datePublished,
          date_received: dateReceived,
          softcopy: reqBody.softcopy === 'yes',
          scanned: reqBody.scanned === 'yes'
      };
    },
    addUpload: function(options, callback) {
        var docs = db.coll('documents');

        docs.update({
            _id: module.exports.getId(options)
        }, {
            $addToSet: {
                uploads: {
                    name: options.name,
                    filename: options.filename
                }
            }
        }, function(err, result) {
            callback(err, result);
        });
    },
    // hackery for mongodb's ObjectID function
    getId: function(options) {
        if (options.id && options.id.length === 24) {
            return db.ObjectID(options.id);
        } else {
            return options.id;
        }
    },
    update: function(options, callback) {
        var data = _.omit(options.data, 'username', 'created_at'), // in case they get passed
            docs = db.coll('documents'),
            now = new Date(),
            id = module.exports.getId(options);

        data.last_modified = now;

        if (options.resetApproved) {
            data.approved = undefined;
        }

        docs.update({
            _id: id
        }, {
            $set: data
        }, callback);
    }
};
