var express = require('express')
    , app = express()
    , path = require('path')
    , favicon = require('static-favicon')
    , logger = require('morgan')
    , cookieParser = require('cookie-parser')
    , bodyParser = require('body-parser')
    , urlencodedParser = bodyParser.urlencoded({ extended : false })
    , routes = require('./routes')
    , mongoose = require('mongoose')
    , config = require('./config/main-config')
    , MongoClient = require('mongodb').MongoClient;


var CONNECT_URL='';  //CONNECTION URL FOR MONGODB
var DB_URL='';
// 'admin:rCcJbBS7zb-g@127.0.0.1:51881/website';


if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){                                //IF RUNNING ON OPENSHIFT
  DB_URL = 'mongodb://' + config.OPENSHIFT_MONGODB_USERNAME + ':' +
                               config.OPENSHIFT_MONGODB_PASSWORD  + '@' +
                               config.OPENSHIFT_MONGODB_HOSTNAME + ':' +
                               config.OPENSHIFT_MONGODB_PORT + '/';
  CONNECT_URL = DB_URL + config.OPENSHIFT_DB_NAME;
}else{                                                                        //IF RUNNING LOCALLY
  DB_URL = 'mongodb://' + config.LOCAL_MONGODB_USERNAME +
                               config.LOCAL_MONGODB_PASSWORD  +
                               config.LOCAL_MONGODB_HOSTNAME + ':' +
                               config.LOCAL_MONGODB_PORT + '/';
  CONNECT_URL = DB_URL + config.LOCAL_DB_NAME;
}
console.log(CONNECT_URL);


MongoClient.connect(CONNECT_URL, function(err, db) {
  

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.use(favicon());
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    //INCLUDE THE USER ROUTES
    routes(app,db);

    //INCLUDE THE ADMIN ROUTES
    app.use('/admin', require('./routes/admin1')(db,DB_URL)); 
    app.use('/writer', require('./routes/writer')(db,DB_URL));

    var ip_addr = config.EXPRESS_IP_ADDRESS;
    var port = config.EXPRESS_PORT_ADDRESS;
    //START THE APP
    app.listen(port,ip_addr);
    console.log('Express server listening on http://'+ip_addr + ':' + port);
});
