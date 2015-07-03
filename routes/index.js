var ContentHandler = require('./content')
  , ErrorHandler = require('./error').errorHandler;
 var nodemailer = require('nodemailer');
 var smtpTransport = require('nodemailer-smtp-transport');

module.exports = exports = function(app, db) {

    var contentHandler = new ContentHandler(db);


    // The main page of the blog
    app.get('/', contentHandler.displayMainPage);

	app.get("/post/:permalink", contentHandler.displayPostByPermalink);

    app.get('/tag/:tag', contentHandler.displayMainPageByTag);

	app.get('/home/about',function(req, res){
		res.render('users/about',{title : 'suraj'});
	});

	app.get('/home/subscription_confirmed',function(req, res){
		res.render('users/subs_confirm',{title : 'suraj'});
	});

	app.get('/home/email_sent',function(req, res){
		res.render('users/email_sent',{title : 'suraj'});
	});

	app.get('/home/contact_us',function(req, res){
		res.render('users/contact_us',{title : 'suraj'});
	});

	//app.get('/api/testData',contentHandler.postByPage);

	app.get('/home/:pageNo',contentHandler.displayPostsByPage);

	app.post('/contact', function(req, res) {
	  var mailOpts, smtpTrans;

	 var transporter = nodemailer.createTransport(smtpTransport({
	  service: 'Gmail',
	  auth: { 
	  		user: 'ravishetty150@gmail.com',
	        pass: 'nmamitsucks' 
	    }
	  }));

	  //Mail options
	var mailOptions = {
      from: 'Ravi shetty <ravishetty150@gmail.com>',
      to: "<bksuraj1994@gmail.com>, <dkshthshetty7@gmail.com>",
      subject: 'Hello',
      text: 'Hello world',
      html: '<b>Hello world</b>'
     };

	transporter.sendMail({
      from: 'Ravi shetty <ravishetty150@gmail.com>',
      to: "<bksuraj1994@gmail.com>,<dkshthshetty7@gmail.com>",
      subject: 'Hello',
      text: 'Hello world',
      html: "<h3>Subscription Confirmation</h3><form action='192.168.1.2:8000/home/subscription_confirmed' method='post' target='_blank'><input type='submit' value='Confirm' /></form>"
     }, function(error, info) {
	      //Email not sent
	      if (error) {
	      	console.log(error);
			  //res.write('error');
	          res.redirect('/')	      
	      }
	      //Yay!! Email sent
	      else {
	      	  console.log("djhkwdj" + info);
	          //res.write('email sent.. ');
	          res.redirect('/')
	      }
	  });
	});

    app.use(ErrorHandler);
}
