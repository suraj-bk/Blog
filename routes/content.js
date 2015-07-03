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
            console.log(results);
            return res.render('users/index', {
                totPages : totalNumPages,
                posts: results,
                pnum : 1
            });
        });
    }

    this.postByPage = function (req, res) {
      var page = parseInt(req.query.page),
         size = parseInt(req.query.size),
         skip = page > 0 ? ((page - 1) * size) : 0;
 
      db.collection("articles").find(null, null, {
         skip: skip,
         limit: size
      }, function (err, data) {
         if(err) {
            res.json(500, err);
         }
         else {
            res.json({
               data: data
            });
         }
      });
   };

    this.displayPostsByPage = function(req, res, next){
    	"use strict";
    	db.collection("articles").count(function(error, nbDocs) {
            totalNumPages =  Math.ceil(nbDocs/totalPostPerPage);
        });
    	var pageNo = req.params.pageNo;
    	posts.getPostsByPage(totalPostPerPage, pageNo, function(err, results) {
            "use strict";
            if (err) return next(err);
            console.log(results.json);
            return res.render('users/index', {
                totPages : totalNumPages,
                posts: results,
                pnum : pageNo
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
