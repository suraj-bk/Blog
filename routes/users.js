var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;


module.exports = function(){

	router.get('/',function(req, res){
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

	router.get('/home/article',function(req, res){
		MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
		    "use strict";
		    if(err) throw err;

		    db.collection('articles').find({}).toArray(function(err,docs){
		    	if(err) throw err;

			    res.render('users/post_article',{title : 'suraj', posts : docs });

		    	return db.close();
		    		
		    });
		});	 

	});

	router.get('/tags/:tagname',function(req, res){
		MongoClient.connect('mongodb://localhost:27017/nodeblog', function(err, db) {
		    "use strict";
		    if(err) throw err;

		    var tagName = req.params.tagName;
			var query = {};
			var asa = {};
			asa['in'] = [tagName];
			query['tags'] = asa;
		    //var query = { tags : { $in : [ tagName ] } }

		    db.collection('articles').find(query).toArray(function(err,docs){
		    	if(err) throw err;

			    res.render('users/index',{title : 'suraj', posts : docs, pageNo : 1, totPage : 3,  limit : 4 });

		    	return db.close();
		    		
		    });
		});	 

	});

	router.get('/home/about',function(req, res){

		res.render('users/about',{title : 'suraj'});

	});

	router.get('/home/contact_us',function(req, res){

		res.render('users/contact_us',{title : 'suraj'});

	});

	router.get('/home/:pageNo',function(req, res){
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
	});
	return router;
}





