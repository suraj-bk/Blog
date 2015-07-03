var express = require('express')
    , app = express()
    , path = require('path')
    , favicon = require('static-favicon')
    , logger = require('morgan')
    , cookieParser = require('cookie-parser')
    , bodyParser = require('body-parser')
    , urlencodedParser = bodyParser.urlencoded({ extended : false })
    , dbConfig = require('./db')
    , routes = require('./routes')
    , mongoose = require('mongoose')
    , MongoClient = require('mongodb').MongoClient;

// Connect to DB
mongoose.connect(dbConfig.url);


MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    app.use(favicon());
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    var passport = require('passport');
    var expressSession = require('express-session');

    app.use(expressSession({secret: 'mySecretKey'}));
    app.use(passport.initialize());
    app.use(passport.session());

    var flash = require('connect-flash');
    app.use(flash());

    // Initialize Passport
    var initPassport = require('./passport/init');
    initPassport(passport);

    var routes1 = require('./routes/admin')(passport,urlencodedParser);
    app.use('/admin', routes1);

    routes(app,db);
    app.listen(8000);
    console.log('Express server listening on port 8000');
});
