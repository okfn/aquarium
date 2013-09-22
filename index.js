/**
 * Module dependencies.
*/

var express = require('express'),
    bcrypt = require('bcrypt'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    routes = require('./routes'),
    users = require('./routes/users'),
    admin = require('./routes/admin'),
    http = require('http'),
    path = require('path'),
    app = express(),
    config = require('./lib/config'),
    db = require('./lib/db'),
    MongoStore = require('connect-mongo')(express);

db.init(function(err, database) {
    var userColl = db.coll('users');

    // all environments
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser(config.COOKIE_SECRET));
    app.use(express.session({
        secret: config.SESSION_SECRET,
        store: new MongoStore({
            db: database
        })
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(require('less-middleware')({ src: __dirname + '/public' }));
    app.use(express.static(path.join(__dirname, 'public')));

    // development only
    if ('development' == app.get('env')) {
        app.use(express.errorHandler());
    }

    // initialise routes
    routes.init(app);
    users.init(app);
    admin.init(app);

    passport.use(new LocalStrategy(function(username, password, done) {
        userColl.findOne({
            _id: username
        }, function(err, user) {
            if (err) {
                done(err);
            } else if (user) {
                bcrypt.compare(password, user.hash, function(err, matches) {
                    if (err || !matches) {
                        done(err, false, { message: 'Incorrect password.' });
                    } else {
                        done(null, user);
                    }
                });
            } else {
                done(null, false, { message: 'Incorrect username.' });
            }
        });
    }));

    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        userColl.findOne({
            _id: id
        }, function(err, user) {
            done(err, user);
        });
    });

    http.createServer(app).listen(app.get('port'), function() {
        console.log('Express server listening on port ' + app.get('port'));
    });
});
