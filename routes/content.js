var PostsDAO = require('../posts').PostsDAO;
function ContentHandler (db) {
    "use strict";
    var posts = new PostsDAO(db);
    var totalPostPerPage = posts.totalPostPerPage;
    var totalNumPages;

    this.displayMainPage = function(req, res, next) {
        "use strict";
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
                            tags: tag_results
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
            return res.render('users/index', {
                totPages : totalNumPages,
                posts: results
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

            return res.render('users/post_article', {
            	post_title : post.title,
                author_name: post.author_name,
                post_body: post.body
            });
        });
    }

    this.displayMainPageByTag = function(req, res, next) {
        "use strict";

        var tag = req.params.tag;

        posts.getPostsByTag(tag, 10, function(err, results) {
            "use strict";

            if (err) return next(err);

            return res.render('users/index', {
                totPages : totalNumPages,
                posts: results
            });
        });
    }


}

module.exports = ContentHandler;
