var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var	urlencodedParser = bodyParser.urlencoded({ extended : false });
var MongoClient = require('mongodb').MongoClient;
var path = require('path')
var templatesDir   = path.resolve(__dirname, '..', 'template')
var emailTemplates = require('email-templates')
var nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/admin');
}

module.exports = function(passport,urlencodedParser){

	/* GET login page. */
	router.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('admin/index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/admin/home',
		failureRedirect: '/admin',
		failureFlash : true  
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('admin/register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/admin/home',
		failureRedirect: '/admin/signup',
		failureFlash : true  
	}));

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		//res.render('home', { user: req.user });
		res.render('admin/admin_home',{title : 'suraj'});
	});

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/admin');
	});

	router.get('/add_post',isAuthenticated,function(req, res){
		res.render('admin/admin_add_post',{title : 'suraj'});
	});

	router.post('/html_preview',isAuthenticated,function(req, res){
		res.render('admin/admin_preview',{ html_code : req.body.post_descr });
	});

	router.post('/add_post', urlencodedParser, function(req, res){
		MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
		    "use strict";
		    if(err) throw err;

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
					
				}
				res.render('admin/admin_add_post',{title : 'suraj', post_added : true });
				console.log("Data inserted successfully");
				return db.close();
			});		
		});

	});

	router.get('/mod_post',isAuthenticated,function(req, res){
		res.render('admin/admin_modify_post',{title : 'suraj'});
	});


	//deleting the post
	router.post('/del_post',function(req, res){
		MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
		    "use strict";
		    if(err) throw err;

			var post = {
				title : req.body.post_title
			};	

			db.collection('articles').remove(post, function(err,removed){
				if(err) {
					console.log("Alert");
					return db.close();
				}

				res.render('admin/admin_modify_post',{title : 'suraj', post_deleted : true });
				console.log("Data removed successfully");
				return db.close();
			});


		});	

	});

	//updating the posts
	router.post('/upd_post',function(req, res){
		MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
		    "use strict";
		    if(err) throw err;

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
					return db.close();
				}

				console.log("Data updated successfully");
				res.render('admin/admin_modify_post',{title : 'suraj', post_updated : true });
				return db.close();
			});

		});	

	});


	router.get('/add_editor',isAuthenticated,function(req, res){
		res.render('admin/admin_add_editor',{title : 'suraj'});
	});



	router.post('/add_editor', urlencodedParser, function(req, res){
		MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
		    "use strict";
		    if(err) throw err;

			var editor = {
				name : req.body.editor_name,
				description : req.body.editor_descr,
				social : { twitter: req.body.editor_twitter }
			};
			db.collection('editors').insert(editor,function(err,inserted){
				if(err) {
					console.log("Alert");
					return db.close();
					
				}
				res.render('admin/admin_add_editor',{title : 'suraj', editor_added : true });
				console.log("Data inserted successfully");
				return db.close();
			});		
		});

	});

	router.get('/mod_editor',isAuthenticated,function(req, res){
		res.render('admin/admin_modify_editor',{title : 'suraj'});
	});


	//deleting the editor
	router.post('/del_editor',function(req, res){
		MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
		    "use strict";
		    if(err) throw err;

			var editor = {
				name : req.body.editor_name
			};	

			db.collection('editors').remove(editor, function(err,removed){
				if(err) {
					console.log("Alert");
					return db.close();
				}

				res.render('admin/admin_modify_editor',{title : 'suraj', editor_deleted : true});
				console.log("Data removed successfully");
				return db.close();
			});


		});	

	});

	//updating the editor
	router.post('/upd_editor',function(req, res){
		MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
		    "use strict";
		    if(err) throw err;

			var editor = {
				name : req.body.editor_name
			};

			var operator = {
				'$set' : {
					description : req.body.editor_descr
				}
			};	

			db.collection('editors').update(editor, operator, function(err,removed){
				if(err) {
					console.log("Alert");
					return db.close();
				}

				res.render('admin/admin_modify_editor',{title : 'suraj', editor_updated : true});
				console.log("Data updated successfully");
				return db.close();
			});

		});	

	});

	router.get('/newsletter',isAuthenticated,function(req, res){
		res.render('admin/admin_newsletter',{title : 'suraj'});
	});

	router.get('/newsletter_send',isAuthenticated, function(req, res) {
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

				MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
				    "use strict";
				    if(err) throw err;	
				    var cursor = db.collection('email_sub').find({});
					cursor.each(function(err,ob){
						if(ob != null){
							var locals = {
						      	name : ob.email
						    };
						    //var EMAIL = "ravishetty150@gmail.com"; // Email to send.
						    var EMAIL = ob.email; // Email to send.
						    // Send a newsletter
						    template('newsletter', locals, function(err, html, text) {
						      	if (err) {
						        	console.log("template error : " +err);
						      	} else {
						        	transporter.sendMail({
							          	from: '忍者コーダー <smtp.mailgun.org>',
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
					res.render('admin/admin_home', {newsletter_sent : true });
				});		    
			}
		});
	});




	router.get('/email_snd',function(req,res){
		res.render('emailer/index');
	});

	return router;
}





