var ContentHandler = require('./content')
  , ErrorHandler = require('./error').errorHandler;

module.exports = exports = function(app, db) {

    var contentHandler = new ContentHandler(db);


    // The main page of the blog
    app.get('/', contentHandler.displayMainPage);

	app.get("/post/:permalink", contentHandler.displayPostByPermalink);

    app.get('/tags/:tag', contentHandler.displayMainPageByTag);

	app.get('/home/about',function(req, res){
		res.render('users/about',{title : 'suraj'});
	});

	app.get('/home/contact_us',function(req, res){
		res.render('users/contact_us',{title : 'suraj'});
	});

	app.get('/home/:pageNo',contentHandler.displayPostsByPage);

    app.use(ErrorHandler);
}
