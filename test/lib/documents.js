var assert = require('assert'),
    moment = require('moment'),
    documents = require('../../lib/documents');

describe('documents', function() {
  describe('#validateAndBuild', function() {
    var assertStub = function() {
      return {
        isIn: function() {},
        notEmpty: function() {},
        isValidDate: function() {},
      };
    };

    it('should parse the dates correctly', function() {
      var doc,
          expectedDatePublished = '22 Abr 2014',
          datePublished = '07 Sep 2014',
          dateReceived = '09 Oct 2014',
          dateFormat = 'DD MMM YYYY',
          body = {
            type: 'Pre-Budget Statement',
            title: '2014 Budget',
            expected_date_published: expectedDatePublished,
            date_published: datePublished,
            date_received: dateReceived,
          };

      doc = documents.validateAndBuild(body, assertStub);

      assert.equal(doc.expected_date_published._i,
                   moment(expectedDatePublished, dateFormat)._i);
      assert.equal(doc.date_published._i,
                   moment(datePublished, dateFormat)._i);
      assert.equal(doc.date_received._i,
                   moment(dateReceived, dateFormat)._i);
    });
  });
});

