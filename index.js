/**
 * Module dependencies.
*/

var express = require('express'),
    bcrypt = require('bcrypt'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    app = express(),
    db = require('./lib/db');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session({
    secret: 'session secret'
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

app.get('/', routes.index);
app.get('/login', user.showLogin);
app.get('/setup', user.showSetup);
app.post('/setup', user.createAdmin);
app.post('/login', user.doLogin);

db.init(function() {
    var users = db.coll('users');

    passport.use(new LocalStrategy(function(username, password, done) {
        users.findOne({
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
        users.findOne({
            _id: id
        }, function(err, user) {
            done(err, user);
        });
    });

    http.createServer(app).listen(app.get('port'), function() {
        console.log('Express server listening on port ' + app.get('port'));
    });
});
