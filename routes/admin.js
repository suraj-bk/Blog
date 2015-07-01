var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var	urlencodedParser = bodyParser.urlencoded({ extended : false });
var MongoClient = require('mongodb').MongoClient;
var nodemailer = require("nodemailer");


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

	router.post('/add_post', urlencodedParser, function(req, res){
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
					
				}
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
	router.post('/admin/upd_post',function(req, res){
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

	router.get('/email_snd',function(req,res){
		res.render('emailer/index');
	});

	return router;
}





