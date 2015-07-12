var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var	urlencodedParser = bodyParser.urlencoded({ extended : false });
var MongoClient = require('mongodb').MongoClient;
var path = require('path')

var cloudinary = require('cloudinary');
var fs = require('fs');
var path = require('path');

var moment = require('moment');

var multer = require('multer');
var fileUpload_done = false;

cloudinary.config({ 
  cloud_name: 'codejitsu', 
  api_key: '818719648838795', 
  api_secret: 'YTa5Ul_bzlJ4g0jL9ORMUGjxGYs' 
});

var PostsDAO = require('../posts').PostsDAO;

var needsGroup = function(group,req,res,next) {
    if (req.user && req.user.group === group){
      console.log("You are a writer");	
      return next();
    }
    else{
      console.log("You are not a writer");
      res.redirect('/writer');
      //res.end(401, 'Unauthorized');
    }
};


var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return needsGroup('writer',req, res, next);
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/writer');
	console.log("gone ......");
}

module.exports = function(passport,urlencodedParser){

	/* GET login page. */
	router.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('writer/index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('loginWriter', {
		successRedirect: '/writer/writer_acc/home',
		failureRedirect: '/writer',
		failureFlash : true  
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('writer/register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signupWriter', {
		successRedirect: '/writer/writer_acc/home',
		failureRedirect: '/writer/signup',
		failureFlash : true  
	}));

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/writer');
	});

	/* GET Home Page */
	router.get('/writer_acc/home', isAuthenticated, function(req, res){
		//res.render('home', { user: req.user });
		res.render('writer/writer_home',{title : 'suraj'});
	});

	router.get('/writer_acc/add_post',isAuthenticated,function(req, res){
		res.render('writer/writer_add_post',{title : 'suraj'});
	});

	router.post('/writer_acc/html_preview',isAuthenticated,function(req, res){
		res.render('writer/writer_preview',{ html_code : req.body.post_descr });
	});

	router.post('/writer_acc/add_post', urlencodedParser, function(req, res){
		MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
		    "use strict";
		    if(err) throw err;

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
					return db.close();
					
				}
				res.render('writer/writer_add_post',{title : 'suraj', post_added : true });
				console.log("Data inserted successfully");
				return db.close();
			});		
		});

	});

	router.get('/writer_acc/mod_post',isAuthenticated,function(req, res){
		res.render('writer/writer_modify_post',{title : 'suraj'});
	});


	//deleting the post
	router.post('/writer_acc/del_post',function(req, res){
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

				res.render('writer/writer_modify_post',{title : 'suraj', post_deleted : true ,rem : removed });
				console.log("Data removed successfully");
				return db.close();
			});


		});	

	});

	//updating the posts
	router.post('/writer_acc/upd_post',function(req, res){
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
				res.render('writer/writer_modify_post',{title : 'suraj', post_updated : true });
				return db.close();
			});

		});	

	});

	router.use(multer({ dest: './uploads/',
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

	router.get('/writer_acc/clean_images',isAuthenticated, function(req, res) {
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
	router.post('/writer_acc/image_upload/posts_short',function(req,res){

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

	router.post('/writer_acc/image_upload/posts_full',function(req,res){
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

	router.post('/writer_acc/image_upload/posts_others',function(req,res){

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

	return router;
}





