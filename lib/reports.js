var db = require('./db');

module.exports = {
    /**
     * Get a list of reports either for a user, or if "admin" is passed in, everyone.
     *
     * @param {Object} options
     * @param {String} options.user_id username
     * @param {String} options.page 1 based
     * @param {String} [options.pageSize]
     * @param {Boolean} [options.admin]
     */
    list: function(options, callback) {
        var reports = db.coll('reports'),
            page = options.page || 1,
            pageSize = options.pageSize || 25,
            query = {};

        if (!options.admin) {
            query.user_id = options.user_id;
        }

        reports.find({
            $orderby: {
                created_at: -1
            },
            query: query
        }).limit(pageSize).skip((page - 1) * pageSize).toArray(callback);
    },
    /**
     * Add a new report.
     *
     * @param {Object} data
     * @param {Function} callback
     */
     insert: function(data, callback) {
         var reports = db.coll('reports');

         data.created_at = new Date();

         reports.insert(data, callback);
     },
     /**
      * Get the report with the matching id
      *
      * @param {Object} options
      * @param {String} options.id Id of the report
      */
     get: function(options, callback) {
         var reports = db.coll('reports'),
             id = db.getId(options.id);

         reports.findOne({
             _id: id
         }, callback);
     }
};
