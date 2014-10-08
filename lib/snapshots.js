var _ = require('underscore'),
    async = require('async'),
    db = require('./db'),
    moment = require('moment');

module.exports = {
    /**
     * Snapshots is a snapshot of the document status for every country every
       month. It is created outside of Aquarium.
     */
    listAll: function(query, callback) {
        var snapshots = db.coll('snapshots');

        snapshots.find({
            $orderby: {
              date: -1,
            },
            $query: query
        }).toArray(callback);
    }
};
