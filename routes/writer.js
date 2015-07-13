module.exports = exports = function(db,DB_URL){
	var express = require('express')
  	, app = express()
  	, passport = require('passport')
    , expressSession = require('express-session')
    , flash = require('connect-flash')
    , bodyParser = require('body-parser')
	, urlencodedParser = bodyParser.urlencoded({ extended : false })
	, MongoClient = require('mongodb').MongoClient
	, path = require('path')
	, templatesDir   = path.resolve(__dirname, '..', 'template')
	, emailTemplates = require('email-templates')
	, nodemailer = require("nodemailer")
	, smtpTransport = require('nodemailer-smtp-transport')
	, cloudinary = require('cloudinary')
	, fs = require('fs')
	, path = require('path')
	, moment = require('moment')
	, multer = require('multer')
	, mongoose = require('mongoose')
	, fileUpload_done = false
	, PostsDAO = require('../posts').PostsDAO
	, config = require('../config/main-config');  // INCLUDE THE CONFIG FILE

	//mongoose.connect(DB_URL + 'website');
	console.log(DB_URL + 'website');
	//CLOUDINARY CONFIGURATION DETAILS
	cloudinary.config({ 
	  cloud_name: config.CLOUD_NAME, 
	  api_key: config.CLOUD_API_KEY, 
	  api_secret: config.CLOUD_API_SECRET
	});

	// APP SESSION HANDLING AND PASSPORT AUTHENTICATION
    app.use(expressSession({secret: 'mySecretKey'}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    // Initialize Passport
    var initPassport = require('../passport/init');
    initPassport(passport);

    var needsGroup = function(group,req,res,next) {
	    if (req.user && req.user.group === group){
	      console.log("You are a writer");	
	      return next();
	    }
	    else{
	      console.log("You are not a writer");
	      res.redirect('/writer');
	    }
	};

    // FUNCTION TO CHECK AUTHENTICATION
    var isAuthenticated = function (req, res, next) {
		if (req.isAuthenticated())
			return needsGroup('writer',req, res, next);
		res.redirect('/writer');
		console.log("gone ......");
	}


    // DEFINING THE ADMIN ROUTES
	/* GET login page. */
	app.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('writer/index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	app.post('/login', passport.authenticate('loginWriter', {
		successRedirect: '/writer/writer_acc/home',
		failureRedirect: '/writer',
		failureFlash : true  
	}));

	/* GET Registration Page */
	app.get('/signup', function(req, res){
		res.render('writer/register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	app.post('/signup', passport.authenticate('signupWriter', {
		successRedirect: '/writer/writer_acc/home',
		failureRedirect: '/writer/signup',
		failureFlash : true  
	}));

	/* Handle Logout */
	app.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/writer');
	});

	/* GET Home Page */
	app.get('/writer_acc/home', isAuthenticated, function(req, res){
		//res.render('home', { user: req.user });
		res.render('writer/writer_home',{title : 'suraj'});
	});

	app.get('/writer_acc/add_post',isAuthenticated,function(req, res){
		res.render('writer/writer_add_post',{title : 'suraj'});
	});

	app.post('/writer_acc/html_preview',isAuthenticated,function(req, res){
		res.render('writer/writer_preview',{ html_code : req.body.post_descr });
	});

	app.post('/writer_acc/add_post', urlencodedParser, function(req, res){
		    "use strict";

			var tags = req.body.post_tags;
			tags = tags.split(',');

			var post = {
				title : req.body.post_title,
				desc_short: req.body.desc_short,
				body : req.body.post_descr,
				author_name : req.body.post_author,
				tags : tags,
				category : req.body.post_category,
				date: moment().format('MMMM Do YYYY'),
				createdOn: moment().valueOf(),
				published : "false"
			};
			db.collection('articles').insert(post,function(err,inserted){
				if(err) {
					console.log("Alert");
					return ;
					
				}
				res.render('writer/writer_add_post',{title : 'suraj', post_added : true });
				console.log("Data inserted successfully");
				return ;
			});		
	});

	app.get('/writer_acc/mod_post',isAuthenticated,function(req, res){
		res.render('writer/writer_modify_post',{title : 'suraj'});
	});


	//deleting the post
	app.post('/writer_acc/del_post',function(req, res){
	    "use strict";
		var post = {
			title : req.body.post_title
		};	
		db.collection('articles').remove(post, function(err,removed){
			if(err) {
				console.log("Alert");
				return;
			}
			res.render('writer/writer_modify_post',{title : 'suraj', post_deleted : true ,rem : removed });
			console.log("Data removed successfully");
			return;
		});
	});

	//updating the posts
	app.post('/writer_acc/upd_post',function(req, res){
	    "use strict";
		var post = {
			title : req.body.post_title
		};

		var operator = {
			'$set' : {
				body : req.body.post_descr
			}
		};	

		db.collection('articles').update(post, operator, function(err,removed){
			if(err) {
				console.log("Alert");
				return;
			}

			console.log("Data updated successfully");
			res.render('writer/writer_modify_post',{title : 'suraj', post_updated : true });
			return ;
		});
	});

	app.use(multer({ dest: './uploads/',
		rename: function (fieldname, filename) {
		    return filename+Date.now();
		},
		onFileUploadStart: function (file) {
		  	console.log(file.originalname + ' is starting ...');
		},
		onFileUploadComplete: function (file) {
		  	console.log(file.fieldname + ' uploaded to  ' + file.path);
		  	fileUpload_done = true;
		}
	}));

	app.get('/writer_acc/clean_images',isAuthenticated, function(req, res) {
		var p = "./uploads/"
		fs.readdir(p, function(err, list_of_files) {
			if (err) throw err;
			list_of_files.map(function (file) {
		        return path.join(p, file);
		    }).forEach(function(filename) {
				fs.unlink(filename);
				console.log(filename + " deleted");
			});
			res.render('writer/writer_home', {images_cleaned : true });	
		});
	});	

	//cloudinary
	app.post('/writer_acc/image_upload/posts_short',function(req,res){

		if(fileUpload_done == true){
			console.log(req.files);

			var originalImageName = req.files.myImage.originalname;
			originalImageName = originalImageName.split('.')[0];
			var post_title = req.body.img_post_title;
			if(typeof post_title === "undefined")
				var cloudPath = "Posts_short/" + originalImageName;
			else	
				var cloudPath = "Posts_short/" + post_title + "/" + originalImageName;
			cloudinary.uploader.upload(req.files.myImage.path, function(result) { 
			   console.log(result);

			   res.end('{"success" : "Uploaded Successfully", "status" : 200}');
			   fileUpload_done = false;
			},{ public_id: cloudPath });
		}

	});

	app.post('/writer_acc/image_upload/posts_full',function(req,res){
		console.log("asasaasa");
		if(fileUpload_done == true){
			console.log(req.files);

			var originalImageName = req.files.myImage.originalname;
			originalImageName = originalImageName.split('.')[0];
			var post_title = req.body.img_post_title;
			if(typeof post_title === "undefined")
				var cloudPath = "Posts_full/" + originalImageName;
			else	
				var cloudPath = "Posts_full/" + post_title + "/" + originalImageName;
			
			cloudinary.uploader.upload(req.files.myImage.path, function(result) { 
			   console.log(result);

			   res.end('{"success" : "Uploaded Successfully", "status" : 200}');
			   fileUpload_done = false;
			},{ public_id: cloudPath });
		}
	});

	app.post('/writer_acc/image_upload/posts_others',function(req,res){

		if(fileUpload_done == true){
			console.log(req.files);

			var originalImageName = req.files.myImage.originalname;
			originalImageName = originalImageName.split('.')[0];
			var post_title = req.body.img_post_title;
			if(typeof post_title === "undefined")
				var cloudPath = "Posts_full/" + originalImageName;
			else	
				var cloudPath = "Posts_full/" + post_title + "/" + originalImageName;

			cloudinary.uploader.upload(req.files.myImage.path, function(result) { 
			   console.log(result);
			   var response = {
			   		success : "Uploaded Successfully",
			   		status : 200,
			   		url_path : result.url
			   }
			   res.end(JSON.stringify(response));
			   fileUpload_done = false;
			},{ public_id: cloudPath });
		}
	});


  return app;
};