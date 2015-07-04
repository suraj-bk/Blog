var PostsDAO = require('../posts').PostsDAO;
var url = require('url');

function ContentHandler (db) {
    "use strict";
    var posts = new PostsDAO(db);
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

            posts.getHotPosts(5, 1, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        return res.render('users/index', {
                            totPages : totalNumPages,
                            posts: results,
                            pnum : 1,
                            hot_posts: hot_results,
                            categories: category_results,
                            tags: tag_results,
                            email_sent: email_sent_value
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
            posts.getHotPosts(5, 1, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        return res.render('users/index', {
                            totPages : totalNumPages,
                            posts: results,
                            pnum : pageNo,
                            hot_posts: hot_results,
                            categories: category_results,
                            tags: tag_results
                        });    
                    });
                });
            });    
        });
    }

    this.displayEmails = function(req, res, next) {
    	posts.getemails(function(err, em) {
            return res.render('email/show', {
                email : em
            });
 	   });
	}

    this.displayPostByPermalink = function(req, res, next) {
        "use strict";

        var permalink = req.params.permalink;


        posts.getPostByPermalink(permalink, function(err, post) {
            "use strict";

            if (err) return next(err);
            if (!post) return res.redirect("/post_not_found");

            posts.getHotPosts(5, 1, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        return res.render('users/post_article', {
                            post_title : post.title,
                            author_name: post.author_name,
                            post_body: post.body,
                            hot_posts: hot_results,
                            categories: category_results,
                            tags: tag_results
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

            posts.getHotPosts(5, 1, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        return res.render('users/index', {
                            totPages : totalNumPages,
                            posts: results,
                            pnum : 1,
                            hot_posts: hot_results,
                            categories: category_results,
                            tags: tag_results
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

            posts.getHotPosts(5, 1, function(err, hot_results) {
                posts.getAllCategories(function(err, category_results) {
                    posts.getAllTags(function(err, tag_results) {
                        return res.render('users/index', {
                            search : true,
                            totPages : totalNumPages,
                            posts: results,
                            pnum : 1,
                            hot_posts: hot_results,
                            categories: category_results,
                            tags: tag_results
                        });    
                    });
                });
            });    
        });
    }


}

module.exports = ContentHandler;
