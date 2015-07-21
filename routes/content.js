var PostsDAO = require('../posts').PostsDAO;
var EditorsDAO = require('../editors').EditorsDAO;
var url = require('url');
var BitlyAPI = require("node-bitlyapi");
var Bitly = new BitlyAPI({
    client_id: "540a31d8a6d06e741d73f009a69b8ea18e907025",
    client_secret: "63f1c19e72f877fda5df9e1b6e6809cdad1db182"  
});
Bitly.setAccessToken("a755e4fd2d16a92993d3aae868513666c00ca33a");

function ContentHandler (db) {
    "use strict";
    var posts = new PostsDAO(db);
    var editors = new EditorsDAO(db);
    var totalPostPerPage = posts.totalPostPerPage;
    var totalNumPages;

    this.displayMainPage = function(req, res, next) {
        "use strict";
        var email_sent_value = req.query.email_sent;
        db.collection("articles").count(function(error, nbDocs) {
            totalNumPages =  Math.ceil(nbDocs/totalPostPerPage);
        });
        posts.getPostsByPage(totalPostPerPage, 1, function(err, results) {
            "use strict";
            if (err) return next(err);
            console.log("kdjlas : "+totalNumPages);

            posts.getHotPosts(5, 0, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        return res.render('users/index', {
                            totPages : totalNumPages,
                            posts: results,
                            pnum : 1,
                            tnum : 0,
                            if_tag : "",
                            hot_posts: hot_results,
                            categories: category_results,
                            tags: tag_results,
                            email_sent: email_sent_value,
                            title : "Code Like Ninja",
                            meta :{
                                description : "A website for publishing articles on various topics and tutorials on development technologies.",
                                keywords : "HTML,CSS,Javascript,Jquery,Node.js,Express,MongoDB,SQL,PHP,Ruby,Rails,C#,.NET,MySQL,,Android,Windows,Cloud,Development,App,Design,Web,Photoshop",
                                author : "Code Like Ninja",
                                image_link : "http://res.cloudinary.com/codejitsu/image/upload/logo.png"
                            }
                        });    
                    });
                });
            });    
        });
    }

    this.displayPostsByPage = function(req, res, next){
    	"use strict";
    	db.collection("articles").count(function(error, nbDocs) {
            totalNumPages =  Math.ceil(nbDocs/totalPostPerPage);
        });
    	var pageNo = req.params.pageNo;
    	posts.getPostsByPage(totalPostPerPage, pageNo, function(err, results) {
            "use strict";
            if (err) return next(err);

            console.log("kdjlas : "+totalNumPages);
            posts.getHotPosts(5, 0, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        return res.render('users/index', {
                            totPages : totalNumPages,
                            posts: results,
                            pnum : pageNo,
                            tnum : 0,
                            if_tag : "",
                            hot_posts: hot_results,
                            categories: category_results,
                            tags: tag_results,
                            title : "Code Like Ninja",
                            meta :{
                                description : "A website for publishing articles on various topics and tutorials on development technologies.",
                                keywords : "HTML,CSS,Javascript,Jquery,Node.js,Express,MongoDB,SQL,PHP,Ruby,Rails,C#,.NET,MySQL,,Android,Windows,Cloud,Development,App,Design,Web,Photoshop",
                                author : "Code Like Ninja",
                                image_link : "http://res.cloudinary.com/codejitsu/image/upload/logo.png"
                            }
                        });    
                    });
                });
            });    
        });
    }

var jd = "block content"+
		"	p email[i].email"+
		"	br"+
		"	p ht";

    this.displayEmails = function(req, res, next) {
    	var  jade = require('jade');
		jade.renderFile('routes/html.jade', {name :"suraj",m_link : "abc",p_link : "abb"}, function(err, html) {
			if(err){
				console.log("error" + err);
			}
	    	// if err...
	    	console.log(html);
	    	posts.getemails(function(err, em) {
            return res.render('email/show', {
                email : em,
                ht :html
            });
 	   });
		});

    	
	}

    this.displayNewsletter = function(req, res, next) {
        var  jade = require('jade');
        jade.renderFile('routes/newsletter.jade',  { name :"Deekshith" }, function(err, html) {
            if(err){
                console.log("error" + err);
            }
            // if err...
            console.log(html);
            posts.getemails(function(err, em) {
                return res.render('email/show', {
                    email : em,
                    ht :html
                });
            });
        });   
    }

    this.displayPostByPermalink = function(req, res, next) {
        "use strict";

        var permalink = req.params.permalink;


        posts.getPostByPermalink(permalink, function(err, the_post) {
            "use strict";

            if (err) return next(err);
            if (!the_post) return res.redirect("/post_not_found");

            posts.getHotPosts(5, 0, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        posts.getPostByCategoryOtherThanTheTitle(the_post.title,the_post.category,5,function(err, sim_post_results) {
                            Bitly.shortenLink("https://codelikeninja.ml/post/"+the_post.title, function(err, shortURL) {
                                console.log("Short URL : " + typeof shortURL);
                                var short_url = JSON.parse(shortURL);
                                return res.render('users/post_article', {
                                    post : the_post,
                                    hot_posts: hot_results,
                                    categories: category_results,
                                    tags: tag_results,
                                    similar_posts : sim_post_results,
                                    title : the_post.title + " - Code Like Ninja",
                                    short_url: short_url.data.url,
                                    meta :{
                                        description : the_post.desc_short,
                                        keywords : the_post.tags.join(),
                                        author : the_post.author_name,
                                        image_link : "http://res.cloudinary.com/codejitsu/image/upload/Posts_short/"+ the_post.title +"/post_short.png"
                                    }
                                });
                            });
                            
                        });        
                    });
                });
            });    
        });
    }

    this.displayMainPageByTag = function(req, res, next) {
        "use strict";

        var tag = req.params.tag;

       posts.getPostsByTag(tag, 10, function(err, results) {
            "use strict";
            if (err) return next(err);
            console.log("kdjlas : "+totalNumPages);

            posts.getHotPosts(5, 0, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        return res.render('users/index', {
                            totPages : totalNumPages,
                            posts: results,
                            pnum : 1,
                            tnum : 0,
                            if_tag : "",
                            hot_posts: hot_results,
                            categories: category_results,
                            tags: tag_results,
                            title : "Code Like Ninja",
                            meta :{
                                description : "A website for publishing articles on various topics and tutorials on development technologies.",
                                keywords : tag + ",HTML,CSS,Javascript,Jquery,Node.js,Express,MongoDB,SQL,PHP,Ruby,Rails,C#,.NET,MySQL,,Android,Windows,Cloud,Development,App,Design,Web,Photoshop",
                                author : "Code Like Ninja",
                                image_link : "http://res.cloudinary.com/codejitsu/image/upload/logo.png"
                            }
                        });    
                    });
                });
            });    
        });
    }

    this.displayTagByPage = function(req, res, next){
    	"use strict";
    	var tag = req.params.tag;
    	var t = req.params.tag;
    	db.collection("articles").find({ tags : tag }).count(function(error, nbDocs) {
            totalNumPages =  Math.ceil(nbDocs/totalPostPerPage);
        });
    	var pageNo = req.params.pageNo;
    	posts.getTagByPage(totalPostPerPage, pageNo, tag, function(err, results) {
            "use strict";
            if (err) return next(err);

            console.log("kdjlas : "+totalNumPages);
            posts.getHotPosts(5, 0, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        return res.render('users/index', {
                            totPages : totalNumPages,
                            posts: results,
                            tnum : pageNo,
                            pnum : 0,
                            if_tag : t,
                            hot_posts: hot_results,
                            categories: category_results,
                            tags: tag_results,
                            tag_query: tag,
                            tag_search: true,
                            title : "Code Like Ninja",
                            meta :{
                                description : "A website for publishing articles on various topics and tutorials on development technologies.",
                                keywords : tag + ",HTML,CSS,Javascript,Jquery,Node.js,Express,MongoDB,SQL,PHP,Ruby,Rails,C#,.NET,MySQL,,Android,Windows,Cloud,Development,App,Design,Web,Photoshop",
                                author : "Code Like Ninja",
                                image_link : "http://res.cloudinary.com/codejitsu/image/upload/logo.png"
                            }
                        });    
                    });
                });
            });    
        });
    }

    this.displayCategoryByPage = function(req, res, next){
        "use strict";
        var cat = req.params.category;
        var c = req.params.category;
        db.collection("articles").find({ category : cat }).count(function(error, nbDocs) {
            totalNumPages =  Math.ceil(nbDocs/totalPostPerPage);
        });
        var pageNo = req.params.pageNo;
        posts.getCategoryByPage(totalPostPerPage, pageNo, cat, function(err, results) {
            "use strict";
            if (err) return next(err);

            console.log("kdjlas : "+totalNumPages);
            posts.getHotPosts(5, 0, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        return res.render('users/index', {
                            totPages : totalNumPages,
                            posts: results,
                            tnum : pageNo,
                            pnum : 0,
                            if_tag : c,
                            hot_posts: hot_results,
                            categories: category_results,
                            tags: tag_results,
                            cat_query: cat,
                            cat_search: true,
                            title : "Code Like Ninja",
                            meta :{
                                description : "A website for publishing articles on various topics and tutorials on development technologies.",
                                keywords : cat + ",HTML,CSS,Javascript,Jquery,Node.js,Express,MongoDB,SQL,PHP,Ruby,Rails,C#,.NET,MySQL,,Android,Windows,Cloud,Development,App,Design,Web,Photoshop",
                                author : "Code Like Ninja",
                                image_link : "http://res.cloudinary.com/codejitsu/image/upload/logo.png"
                            }
                        });    
                    });
                });
            });    
        });
    }

    this.displayPostsBySearch = function(req, res, next) {
        "use strict";

        //var searchQuery = url.parse(request.url, true).query;
        //console.log(searchQuery);

       posts.getPostsBySearch(req.query.q, 10, function(err, results) {
            "use strict";
            if (err) return next(err);
            console.log("kdjlas : "+totalNumPages);

            posts.getHotPosts(5, 0, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        return res.render('users/index', {
                            search : true,
                            totPages : totalNumPages,
                            posts: results,
                            pnum : 1,
                            tnum : 0,
                            if_tag : "",
                            hot_posts: hot_results,
                            categories: category_results,
                            tags: tag_results,
                            search_query: req.query.q,
                            title : "Code Like Ninja",
                            meta :{
                                description : "A website for publishing articles on various topics and tutorials on development technologies.",
                                keywords : "HTML,CSS,Javascript,Jquery,Node.js,Express,MongoDB,SQL,PHP,Ruby,Rails,C#,.NET,MySQL,,Android,Windows,Cloud,Development,App,Design,Web,Photoshop",
                                author : "Code Like Ninja",
                                image_link : "http://res.cloudinary.com/codejitsu/image/upload/logo.png"
                            }
                        });    
                    });
                });
            });    
        });
    }

    this.displayAboutPage = function(req, res, next) {
        "use strict";

        var email_sent_value = req.query.email_sent;
        
        editors.getEditors(function(err, results) {
            "use strict";
            if (err) return next(err);

            posts.getHotPosts(5, 0, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        return res.render('users/about', {
                            editors: results,
                            hot_posts: hot_results,
                            categories: category_results,
                            tags: tag_results,
                            email_sent: email_sent_value,
                            title : "About - Code Like Ninja",
                            meta :{
                                description : "A website for publishing articles on various topics and tutorials on development technologies.",
                                keywords : "HTML,CSS,Javascript,Jquery,Node.js,Express,MongoDB,SQL,PHP,Ruby,Rails,C#,.NET,MySQL,,Android,Windows,Cloud,Development,App,Design,Web,Photoshop",
                                author : "Code Like Ninja",
                                image_link : "http://res.cloudinary.com/codejitsu/image/upload/logo.png"
                            }
                        });    
                    });
                });
            });    
        });
    }


    this.displayContactPage = function(req, res, next) {
        "use strict";
        posts.getHotPosts(5, 0, function(err, hot_results) {
            posts.getAllCategories(function(err, category_results) {
                posts.getAllTags(function(err, tag_results) {
                    return res.render('users/contact_us', {
                        hot_posts: hot_results,
                        categories: category_results,
                        tags: tag_results,
                        title : "Contact - Code Like Ninja",
                        meta :{
                            description : "A website for publishing articles on various topics and tutorials on development technologies.",
                            keywords : "HTML,CSS,Javascript,Jquery,Node.js,Express,MongoDB,SQL,PHP,Ruby,Rails,C#,.NET,MySQL,,Android,Windows,Cloud,Development,App,Design,Web,Photoshop",
                            author : "Code Like Ninja",
                            image_link : "http://res.cloudinary.com/codejitsu/image/upload/logo.png"
                        }
                    });    
                });
            });
        });    
    }

    this.displayHome = function(req, res, next) {
        "use strict";
        res.render('users/homepage', {
            title : "Code Like Ninja",
            meta :{
                description : "A website for publishing articles on various topics and tutorials on development technologies.",
                keywords : "HTML,CSS,Javascript,Jquery,Node.js,Express,MongoDB,SQL,PHP,Ruby,Rails,C#,.NET,MySQL,,Android,Windows,Cloud,Development,App,Design,Web,Photoshop",
                author : "Code Like Ninja",
                image_link : "http://res.cloudinary.com/codejitsu/image/upload/logo.png"
            }
        });    
    }


}

module.exports = ContentHandler;
