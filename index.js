/*var express = require('express')
	,stylus = require('stylus')
	,nib = require('nib')
	,bodyParser = require('body-parser')
	,urlencodedParser = bodyParser.urlencoded({ extended : false })
	,MongoClient = require('mongodb').MongoClient
	,passport = require('passport')
	,expressSession = require('express-session');


var dbConfig = require('./db');
var mongoose = require('mongoose');
// Connect to DB
mongoose.connect(dbConfig.url);

var app = express();
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());

var flash = require('connect-flash');
app.use(flash());
function compile(str,path){
	return stylus(str)
	.set('filename',path)
	.use(nib())
}


//setting views folder
app.set('views',__dirname + '/views');
//set default engine to jade
app.set('view engine','jade');

//Middleware
//app.use(express.logger('dev'));
app.use(stylus.middleware({
	src: __dirname + '/public'
	,compile:compile
}
))
app.use(express.static(__dirname + '/public'));


// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);
var routes = require('./routes/admin')(passport);
app.use('/', routes);

//Defining the routes
app.get('/',function(req, res){
	MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
	    "use strict";
	    if(err) throw err;

	    var options = {
	    	'skip' : 0,
	    	'limit' : 2
	    };

	    db.collection('articles').find({}).toArray(function(err,docs){
	    	if(err) throw err;

    		var nbDocs = docs.length;
    		var limit = 2;

    		db.collection('articles').find({},{},options).toArray(function(err,docs){
		    	if(err) throw err;
		    	//console.log(docs);
		    	res.render('users/index',{title : 'suraj', posts : docs, pageNo : 1, totPage : nbDocs,  limit : limit });

	    		return db.close();
	    	});	
	    		
	  
	    });
	});	
});

app.get('/home/:pageNo',function(req, res){
	MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
	    "use strict";
	    if(err) throw err;

	    var pageNo = req.params.pageNo;
	    var options = {
	    	'skip' : (pageNo-1) * 2,
	    	'limit' : 4
	    };

	    db.collection('articles').find({}).toArray(function(err,docs){
	    	if(err) throw err;

	    	var nbDocs = docs.length;
	    	var limit = 2;

    		db.collection('articles').find({},{},options).toArray(function(err,docs){
		    	if(err) throw err;
		    	//console.log(docs);
		    	res.render('users/index',{title : 'suraj', posts : docs, pageNo : pageNo, totPage : nbDocs, limit : limit });

	    		return db.close();
	    	});	
	  
	    });
	});	
});*/
/*
app.get('/admin/login',function(req, res){
	res.render('admin/admin_login',{title : 'suraj'});
});

app.get('/admin/home',function(req, res){
	res.render('admin/admin_home',{title : 'suraj'});
});

app.get('/admin/add_post',function(req, res){
	res.render('admin/admin_add_post',{title : 'suraj'});
});

app.post('/admin/add_post', urlencodedParser, function(req, res){
	MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
	    "use strict";
	    if(err) throw err;


		res.render('admin/admin_add_post',{title : 'suraj'});

		var tags = req.body.post_tags;
		tags = tags.split(',');

		var post = {
			title : req.body.post_title,
			body : req.body.post_descr,
			author_name : req.body.post_author,
			tags : tags,
			category : req.body.post_category,
			published : "false"
		};

		db.collection('articles').insert(post,function(err,inserted){
			if(err) {
				console.log("Alert");
				return db.close();
			 	//window.document.getElementById("message").setAttribute("class", "alert alert-danger");
				//window.document.getElementById("message").innerHTML = "Data couldnt be inserted";
				
			}
			 //window.document.getElementById("message").setAttribute("class", "alert alert-success");
			//window.document.getElementById("message").innerHTML = "Data inserted successfully";	
			
			console.log("Data inserted successfully");
			return db.close();
		});		
	});

});

app.get('/admin/mod_post',function(req, res){
	res.render('admin/admin_modify_post',{title : 'suraj'});
});


//deleting the post
app.post('/admin/del_post',function(req, res){
	MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
	    "use strict";
	    if(err) throw err;

		res.render('admin/admin_modify_post',{title : 'suraj'});

		var post = {
			title : req.body.post_title
		};	

		db.collection('articles').remove(post, function(err,removed){
			if(err) {
				console.log("Alert");
				return db.close();
			}

			console.log("Data removed successfully");
			return db.close();
		});

	});	

});

//updating the posts
app.post('/admin/upd_post',function(req, res){
	MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
	    "use strict";
	    if(err) throw err;

		res.render('admin/admin_modify_post',{title : 'suraj'});

		var post = {
			title : req.body.post_title
		};	

		db.collection('articles').remove(post, function(err,removed){
			if(err) {
				console.log("Alert");
				return db.close();
			}

			console.log("Data removed successfully");
			return db.close();
		});

	});	

});*/
/*
app.listen(8000);
console.log("Server running on port : " + '8000');*/

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var	urlencodedParser = bodyParser.urlencoded({ extended : false });
var dbConfig = require('./db');
var mongoose = require('mongoose');
// Connect to DB
mongoose.connect(dbConfig.url);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuring Passport
var passport = require('passport');
var expressSession = require('express-session');
// TODO - Why Do we need this key ?
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());

 // Using the flash middleware provided by connect-flash to store messages in session
 // and displaying in templates
var flash = require('connect-flash');
app.use(flash());

// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);

var routes = require('./routes/admin')(passport,urlencodedParser);
app.use('/admin', routes);

var routes = require('./routes/users')();
app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

module.exports = app;
app.listen(8001);
