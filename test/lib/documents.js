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
          datePublished = '07 Sep 2014',
          dateReceived = '09 Oct 2014',
          dateFormat = 'DD MMM YYYY',
          body = {
            type: 'Pre-Budget Statement',
            title: '2014 Budget',
            date_published: datePublished,
            date_received: dateReceived,
          };
      doc = documents.validateAndBuild(body, assertStub);
      assert.equal(doc.date_published,
                   moment(datePublished, dateFormat)._i);
      assert.equal(doc.date_received,
                   moment(dateReceived, dateFormat)._i);
    });
  });

  describe('#getDocumentState', function(doc) {
    describe('available', function() {
      it('is false by default', function() {
        var doc = {};

        assert.notEqual(documents.getDocumentState(doc), 'available');
      });

      it('is false if it haven\'t date_published', function() {
        var doc = {
          available: false,
          date_published: undefined,
        };

        assert.notEqual(documents.getDocumentState(doc), 'available');
      });

      it('is false if it\'s not available and have date_published', function() {
        var doc = {
          available: false,
          date_published: moment(),
        };

        assert.notEqual(documents.getDocumentState(doc), 'available');
      });

      it('is true if it\'s available and have date_published', function() {
        var doc = {
          available: true,
          date_published: moment(),
        };

        assert.equal(documents.getDocumentState(doc), 'available');
      });
    });

    describe('internal', function() {
      it('is false by default', function() {
        var doc = {};

        assert.notEqual(documents.getDocumentState(doc), 'internal');
      });

      it('is false if it haven\'t date_published', function() {
        var doc = {
          date_published: undefined,
        };

        assert.notEqual(documents.getDocumentState(doc), 'internal');
      });

      it('is true if it\'s not available and have date_published', function() {
        var doc = {
          available: false,
          date_published: moment(),
        };

        assert.equal(documents.getDocumentState(doc), 'internal');
      });

      it('is false if it\'s available and have date_published', function() {
        var doc = {
          available: true,
          date_published: moment(),
        };

        assert.notEqual(documents.getDocumentState(doc), 'internal');
      });
    });

    describe('not produced', function() {
      it('is true by default', function() {
        var doc = {};

        assert.equal(documents.getDocumentState(doc), 'not produced');
      });

      it('is true it\'s not available and not haven\'t date_published', function() {
        var doc = {
          available: false,
          date_published: undefined,
        };

        assert.equal(documents.getDocumentState(doc), 'not produced');
      });

      it('is true it was published late', function() {
        var doc = {
          expected_date_published: moment('01-01-2014'),
          date_published: moment('01-06-2014'),
        };

        assert.equal(documents.getDocumentState(doc), 'not produced');
      });

      it('is false it\'s available', function() {
        var doc = {
          available: true,
        };

        assert.notEqual(documents.getDocumentState(doc), 'not produced');
      });

      it('is false have date_published', function() {
        var doc = {
          date_published: moment(),
        };

        assert.notEqual(documents.getDocumentState(doc), 'not produced');
      });
    });
  });
});
