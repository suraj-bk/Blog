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

	mongoose.connect(DB_URL + 'website');
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
    
    var needsGroup = function(group,req,res,next) {
		if (req.user && req.user.group === group){
		  console.log("You are a admin");	
		  return next();
		}
		else{
		  console.log("You are not a admin");
		  //res.end(401, 'Unauthorized');
		  return;
		}
	};

    // FUNCTION TO CHECK AUTHENTICATION
    var isAuthenticated = function (req, res, next) {
		// if user is authenticated in the session, call the next() to call the next request handler 
		// Passport adds this method to request object. A middleware is allowed to add properties to
		// request and response objects
		if (req.isAuthenticated())
			return needsGroup('admin',req, res, next);
		// if the user is not authenticated then redirect him to the login page
		res.redirect('/admin');
	}


    // DEFINING THE ADMIN ROUTES

    // DISPLAYING MAIN ADMIN PAGE	
	app.get('/', function(req, res) {
		res.render('admin/index', { message: req.flash('message') });
	});

	//ADMIN LOGIN ROUTE
	app.post('/login', passport.authenticate('login', {
		successRedirect: '/admin/home',
		failureRedirect: '/admin',
		failureFlash : true  
	}));

	// GET REGISTRATION PAGE 
	app.get('/signup', function(req, res){
		res.render('admin/register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	app.post('/signup', passport.authenticate('signup', {
		successRedirect: '/admin/home',
		failureRedirect: '/admin/signup',
		failureFlash : true  
	}));

	/* GET Home Page */
	app.get('/home', isAuthenticated, function(req, res){
		//res.render('home', { user: req.user });
		res.render('admin/admin_home',{title : 'suraj'});
	});

	/* Handle Logout */
	app.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/admin');
	});

	// ADDING NEW POST
	app.get('/add_post',isAuthenticated,function(req, res){
		res.render('admin/admin_add_post',{title : 'suraj'});
	});

	app.post('/html_preview',isAuthenticated,function(req, res){
		res.render('admin/admin_preview',{ html_code : req.body.post_descr });
	});

	app.post('/add_post', urlencodedParser, function(req, res){
	    "use strict";
		var tags = req.body.post_tags.trim();
		tags = tags.split(',');
		var post = {
			title : req.body.post_title.trim(),
			desc_short: req.body.desc_short,
			body : req.body.post_descr,
			author_name : req.body.post_author.trim(),
			tags : tags,
			category : req.body.post_category.trim(),
			date: moment().format('MMMM Do YYYY'),
			createdOn: moment().valueOf(),
			published : "false"
		};
		db.collection('articles').insert(post,function(err,inserted){
			if(err) {
				console.log("Alert");
				return ;					
			}
			res.render('admin/admin_add_post',{title : 'suraj', post_added : true });
			console.log("Data inserted successfully");
			return;
		});		
	});

	app.get('/mod_post',isAuthenticated,function(req, res){
		res.render('admin/admin_modify_post',{title : 'suraj'});
	});


	//deleting the post
	app.post('/del_post',function(req, res){
	    "use strict";
		var post = {
			title : req.body.post_title.trim()
		};	

		db.collection('articles').remove(post, function(err,removed){
			if(err) {
				console.log("Could delete");
				return;
			}
			res.render('admin/admin_modify_post',{title : 'suraj', post_deleted : true ,rem : removed });
			console.log("Data removed successfully");
			return;
		});
	});

	//updating the posts
	app.post('/upd_post',function(req, res){
	    "use strict";

		var post = {
			title : req.body.post_title.trim()
		};

		var operator = {
			'$set' : {
				body : req.body.post_descr
			}
		};	

		db.collection('articles').update(post, operator, function(err,updated){
			if(err) {
				console.log("Sorry couldnt update");
				return;
			}

			console.log("Data updated successfully for " + updated + " documents");
			res.render('admin/admin_modify_post',{title : 'suraj', post_updated : true });
			return;
		});
	});


	app.get('/add_editor',isAuthenticated,function(req, res){
		res.render('admin/admin_add_editor',{title : 'suraj'});
	});



	app.post('/add_editor', urlencodedParser, function(req, res){
	    "use strict";
		var editor = {
			name : req.body.editor_name.trim(),
			description : req.body.editor_descr,
			social : { twitter: req.body.editor_twitter.trim() }
		};
		db.collection('editors').insert(editor,function(err,inserted){
			if(err) {
				console.log("Alert");
				return ;
				
			}
			res.render('admin/admin_add_editor',{title : 'suraj', editor_added : true });
			console.log("Data inserted successfully");
			return ;
		});		
	});

	app.get('/mod_editor',isAuthenticated,function(req, res){
		res.render('admin/admin_modify_editor',{title : 'suraj'});
	});


	//deleting the editor
	app.post('/del_editor',function(req, res){
	    "use strict";
		var editor = {
			name : req.body.editor_name.trim()
		};	

		db.collection('editors').remove(editor, function(err,removed){
			if(err) {
				console.log("Couldnt delete");
				return;
			}

			res.render('admin/admin_modify_editor',{title : 'suraj', editor_deleted : true});
			console.log("Data removed successfully");
			return;
		});
	});

	//updating the editor
	app.post('/upd_editor',function(req, res){
	    "use strict";
		var editor = {
			name : req.body.editor_name.trim()
		};

		var operator = {
			'$set' : {
				description : req.body.editor_descr
			}
		};	

		db.collection('editors').update(editor, operator, function(err,removed){
			if(err) {
				console.log("Couldnt update");
				return ;
			}

			res.render('admin/admin_modify_editor',{title : 'suraj', editor_updated : true});
			console.log("Data updated successfully");
			return ;
		});
	});

	app.get('/newsletter',isAuthenticated,function(req, res){
		res.render('admin/admin_newsletter',{title : 'suraj'});
	});

	app.get('/newsletter_preveiw',isAuthenticated, function(req, res) {
	    "use strict";
	    var posts = new PostsDAO(db);
	    posts.getHotPosts(5, 1, function(err, hot_results) {
	    	if(err) throw err;
	    	res.render('admin/html_admin', { hot_posts : hot_results });
	    });	
	});	

	app.get('/newsletter_send',isAuthenticated, function(req, res) {
	  	var mailOpts, smtpTrans;

		emailTemplates(templatesDir, function(err, template) {

		  	if (err) {
		    	console.log(err);
		  	} else {
			    // ## Send a single email
			    // Prepare nodemailer transport object
				var transporter = nodemailer.createTransport(smtpTransport({
					  service: 'Mailgun',
					  auth: { 
					  		user: 'postmaster@sandbox0635edeae6f641ebb9abccac5e396f54.mailgun.org', 
					        pass: 'e2f670eefe44504724a607491d160cb5'
					    }
				}));

				    "use strict";
				    var posts = new PostsDAO(db);
				    posts.getHotPosts(5, 1, function(err, hot_results) {


			    	res.render('admin/admin_home', {newsletter_sent : true });
			    	var cursor = db.collection('email_sub').find({});
					cursor.each(function(err,ob){
						if(ob != null){
							var locals = {
						      	name : ob.email,
						      	hot_posts: hot_results
						    };
						    //var EMAIL = "ravishetty150@gmail.com"; // Email to send.
						    var EMAIL = ob.email; // Email to send.
						    // Send a newsletter
						    template('newsletter', locals, function(err, html, text) {
						      	if (err) {
						        	console.log("template error : " +err);
						      	} else {
						        	transporter.sendMail({
							          	from: 'Code Like Ninja <codelikeninja@gmail.com>',
							          	to: "<"+ EMAIL +">",
							          	subject: 'Weekly Newsletter',
							          	html: html,
							          	generateTextFromHTML: true,
							          	text: text
						        	}, function(err, responseStatus) {
						          		if (err) {
						            		console.log("some : " + err);
						          		} else {
							            	console.log("SUCCESS Email sent : " + EMAIL);
							            	
						          		}
						        	});
						      	}
						   	});
						}
					});
			    });	
				res.render('admin/admin_home', {newsletter_sent : true });
			}
		});
	});


	app.post('/AdminNewsletter', function(req, res) {
	  	var mailOpts, smtpTrans;

		emailTemplates(templatesDir, function(err, template) {

		  	if (err) {
		    	console.log(err);
		  	} else {
			    // ## Send a single email
			    // Prepare nodemailer transport object
				var transporter = nodemailer.createTransport(smtpTransport({
					  service: 'Mailgun',
					  auth: { 
					  		user: 'postmaster@sandbox0635edeae6f641ebb9abccac5e396f54.mailgun.org', 
					  		//'ravishetty150@gmail.com',
					        pass: 'e2f670eefe44504724a607491d160cb5'
					        //'nmamitsucks' 
					    }
				}));

				    "use strict";
				    console.log("collection is : "+ req.body.collection);
				    var posts = new PostsDAO(db);
				    posts.getHotPosts(5, 1, function(err, hot_results) {


			    	//res.render('admin/admin_home', {newsletter_sent : true });
			    	var cursor = db.collection(req.body.collection).find({});
					cursor.each(function(err,ob){
						if(ob != null){
							var locals = {
						      	name : ob.email,
						      	hot_posts: hot_results
						    };
						    //var EMAIL = "ravishetty150@gmail.com"; // Email to send.
						    var EMAIL = ob.email; // Email to send.
						    // Send a newsletter
						    template('newsletter', locals, function(err, html, text) {
						      	if (err) {
						        	console.log("template error : " +err);
						      	} else {
						        	transporter.sendMail({
							          	from: 'sample Testing <smtp.mailgun.org>',
							          	to: "<"+ EMAIL +">",
							          	subject: 'Weekly Newsletter',
							          	html: html,
							          	generateTextFromHTML: true,
							          	text: text
						        	}, function(err, responseStatus) {
						          		if (err) {
						            		console.log("some : " + err);
						          		} else {
							            	console.log("SUCCESS Email sent : " + EMAIL);
						          		}
						        	});
						      	}
						   	});
						}
					});
			    });		
			}
		});
	});


	app.get('/email_manager',function(req,res){
	    "use strict";
		var posts = new PostsDAO(db);
		posts.getemails(function(err, em) {
	        return res.render('admin/admin_email_manager', { emails : em });
	    });
	});

	app.get('/email-id',function(req,res){
	    "use strict";
		var posts = new PostsDAO(db);
		posts.getemails(function(err, em) {
	        return res.send(em);
	    });
	});

	app.get('/showSubText',function(req,res){
		fs = require('fs');
		var jade = require('jade');
		fs.readFile('./template/html.jade', 'utf8', function (err,data) {
		  if (err) {
		    return console.log(err);
		  }
		  return res.send(data);
		});
	});

	app.post('/compileJade',function(req,res){
		var jade = require('jade');
	    "use strict";

	    var posts = new PostsDAO(db);
	    posts.getHotPosts(5, 1, function(err, hot_results) {
	    	if(err) throw err;
	    	var fn = jade.compile(req.body.text, {});
	    	var locals = {
						      	name : 'suraj',
						      	hot_posts: hot_results
						    };
			var html = fn(locals);
			console.log(html);
			return res.send(html);
	    });
	});

	app.post('/del_email',function(req,res){
	    "use strict";
	    for (var i=0; i<= req.body.select.length; i++){
	    	var query = {
				email : req.body.select[i]
			};
	    	db.collection("email_sub").remove(query, function(err, items) {
	            "use strict";

	            if (err) throw err;

	            console.log("Deleted " + req.body.select[i] );

	        });
	    }
		res.redirect('/admin/email_manager');   
	});

	app.get('/clean_images',isAuthenticated, function(req, res) {
		var p = "./uploads/"
		fs.readdir(p, function(err, list_of_files) {
			if (err) throw err;
			list_of_files.map(function (file) {
		        return path.join(p, file);
		    }).forEach(function(filename) {
				fs.unlink(filename);
				console.log(filename + " deleted");
			});
			res.render('admin/admin_home', {images_cleaned : true });	
		});
	});	

	//cloudinary
	app.post('/image_upload/posts_short',function(req,res){

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

	app.post('/image_upload/posts_full',function(req,res){
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

	app.post('/image_upload/posts_others',function(req,res){

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

	app.post('/image_upload/editors',function(req,res){

		if(fileUpload_done == true){
			console.log(req.files);

			var originalImageName = req.files.myImage.originalname;
			originalImageName = originalImageName.split('.')[0];
			var cloudPath = "Editors/" + originalImageName;
			cloudinary.uploader.upload(req.files.myImage.path, function(result) { 
			   console.log(result);

			   res.end('{"success" : "Uploaded Successfully", "status" : 200}');
			   fileUpload_done = false;
			},{ public_id: cloudPath });
		}
	});


	app.get('/email_snd',function(req,res){
		res.render('emailer/index');
	});

  return app;
};