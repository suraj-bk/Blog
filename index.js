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


//var connection_string = 'localhost:27017/nodeblog';
var connection_string = 'admin:rCcJbBS7zb-g@127.0.0.1:51881/website';
// if OPENSHIFT env variables are present, use the available connection info:
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  process.env.OPENSHIFT_APP_NAME;
}

MongoClient.connect('mongodb://'+ connection_string, function(err, db) {

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

    var routes2 = require('./routes/writer')(passport,urlencodedParser);
    app.use('/writer', routes2);

    routes(app,db);

    var ip_addr = process.env.OPENSHIFT_NODEJS_IP   || 'localhost';
    var port    = process.env.OPENSHIFT_NODEJS_PORT || '5555';

    app.listen(port,ip_addr);
    console.log('Express server listening on : '+ip_addr + ' : ' + port);
});
