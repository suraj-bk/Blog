/* The PostsDAO must be constructed with a connected database object */
function PostsDAO(db) {
    "use strict";

    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof PostsDAO)) {
        console.log('Warning: PostsDAO constructor called without "new" operator');
        return new PostsDAO(db);
    }

    var posts = db.collection("articles");

    /*this.insertEntry = function (title, body, tags, author, callback) {
        "use strict";
        console.log("inserting blog entry" + title + body);

        // fix up the permalink to not include whitespace
        var permalink = title.replace( /\s/g, '_' );
        permalink = permalink.replace( /\W/g, '' );

        // Build a new post
        var post = {"title": title,
                "author": author,
                "body": body,
                "permalink":permalink,
                "tags": tags,
                "comments": [],
                "date": new Date()}

        // now insert the post
        // hw3.2 TODO
        posts.insert(post, function(err, post) {
          return callback(err, post[0].permalink);
        });
        //callback(Error("insertEntry NYI"), null);
    }*/
    this.totalPostPerPage = 4;
    var totalNumPages = 0;
    this.getPosts = function(num, skip, callback) {
        "use strict";

        posts.find().sort({'created_at.year':-1}).limit(num).skip(skip).toArray(function(err, items) {
            "use strict";

            if (err) return callback(err, null);

            console.log("Found " + items.length + " posts");

            callback(err, items);
        });
    }

    this.getTotalPosts = function(){
        posts.count(function(error, nbDocs) {
            return nbDocs;
        });
    }

    this.getPostsByPage = function(numPostsPerPage, pageNo, callback){
        "use strict";
        posts.find().sort({'created_at.year':-1}).limit(numPostsPerPage).skip(numPostsPerPage*(pageNo - 1)).toArray(function(err, items) {
            "use strict";
            if (err) return callback(err, null);
            callback(err, items);
        });
    }

    this.getHotPosts = function(num, skip, callback) {
        "use strict";

        posts.find().sort({'created_at.year':1}).limit(num).skip(skip).toArray(function(err, items) {
            "use strict";

            if (err) return callback(err, null);

            console.log("Found " + items.length + " posts");

            callback(err, items);
        });
    }

    this.getAllCategories = function(callback) {
        "use strict";

        posts.aggregate([
            {   $group: 
                    { "_id": "$category", "count": { $sum: 1 } }
            }
        ]).toArray(function(err, result) {
            if (err) return callback(err, null);

            console.log("Found " + result.length + " posts");

            callback(err, result);
        });
    }

    this.getAllTags = function(callback) {
        "use strict";

        posts.aggregate([
            {   $unwind : "$tags"},
            {   $group: 
                    { "_id": "$tags", "count": { $sum: 1 } }
            }
            /*{
                $project : 
                    {   "_id": 0, "tag" : $_id, "count": 1 }
            }*/
        ]).toArray(function(err, result) {
            if (err) return callback(err, null);

            console.log("Found " + result.length + " posts");

            callback(err, result);
        });
    }



    this.getPostsByTag = function(tag, num, callback) {
        "use strict";

        posts.find({ tags : tag }).sort({'created_at.date': -1}).limit(num).toArray(function(err, items) {
            "use strict";

            if (err) return callback(err, null);

            console.log("Found " + items.length + " posts");

            callback(err, items);
        });
    }

    this.getPostsBySearch = function(searchQuery, num, callback) {
        "use strict";

        posts.createIndex( { 'title': "text" } );
        console.log(searchQuery);
        //posts.find({ 'title' : {$regex : searchQuery} }).sort({'created_at.date': -1}).limit(num).toArray(function(err, items) {
        posts.find({ $text : {$search : searchQuery} }).sort({'created_at.date': -1}).limit(num).toArray(function(err, items) {
            "use strict";

            if (err) return callback(err, null);

            console.log("Found ikkks" + items.length + " posts");

            callback(err, items);
        });
    }


    this.getPostByPermalink = function(permalink, callback) {
        "use strict";
        posts.findOne({'title': permalink}, function(err, post) {
            "use strict";

            if (err) return callback(err, null);

            callback(err, post);
        });
    }
/*
    this.addComment = function(permalink, name, email, body, callback) {
        "use strict";

        var comment = {'author': name, 'body': body}

        if (email != "") {
            comment['email'] = email
        }

        // hw3.3 TODO
        posts.update({ 'permalink': permalink }, { '$push': { 'comments': comment } }, function(err, result) {
          return callback(err, result);
        });
        //callback(Error("addComment NYI"), null);
    }*/

    this.getemails = function(callback) {
        "use strict";

        db.collection("email_sub").find().toArray(function(err, items) {
            "use strict";

            if (err) return callback(err, null);

            console.log("Found " + items.length + " emails");

            callback(err, items);
        });
    }

}

module.exports.PostsDAO = PostsDAO;
