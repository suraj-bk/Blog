var ContentHandler = require('./content')
  , ErrorHandler = require('./error').errorHandler;
 var path           = require('path')
  , templatesDir   = path.resolve(__dirname, '..', 'template')
  , emailTemplates = require('email-templates')
  , nodemailer     = require('nodemailer');
 var smtpTransport = require('nodemailer-smtp-transport');

var crypto = require('crypto'),
	    algorithm = 'aes-256-ctr',
	    password = 'ninjanevertellspassword';
 
		function encrypt(text){
		  var cipher = crypto.createCipher(algorithm,password)
		  var crypted = cipher.update(text,'utf8','hex')
		  crypted += cipher.final('hex');
		  return crypted;
		}
		 
		function decrypt(text){
		  var decipher = crypto.createDecipher(algorithm,password)
		  try{
		  var dec = decipher.update(text,'hex','utf8')
		  dec += decipher.final('utf8');
		  return dec;
			} catch (ex) {
		  return '';
		}
		}

module.exports = exports = function(app, db) {

    var contentHandler = new ContentHandler(db);


    // The main page of the blog
    app.get('/', contentHandler.displayMainPage);

	app.get("/post/:permalink", contentHandler.displayPostByPermalink);

    app.get('/tags/:tag', contentHandler.displayMainPageByTag);

    app.get('/search', contentHandler.displayPostsBySearch);

	app.get('/home/about',contentHandler.displayAboutPage);

	app.get('/home/subscription_confirmed',function(req, res){
		res.render('users/subs_confirm',{title : 'suraj'});
	});

	app.get('/home/email_sent',function(req, res){
		res.render('users/email_sent',{title : 'suraj'});
	});

	app.get('/home/contact_us',function(req, res){
		res.render('users/contact_us',{title : 'suraj'});
	});

	app.get('/email/show',contentHandler.displayEmails);

	//app.get('/api/testData',contentHandler.postByPage);

	app.get('/home/:pageNo',contentHandler.displayPostsByPage);

	app.post('/contact_us', function(req, res) {

		var cont_name = req.body.cont_name;
		var cont_email = req.body.cont_email;
		var cont_category = req.body.cont_category;
		var cont_descr = req.body.cont_descr;

		// create reusable transporter object using SMTP transport
		var transporter = nodemailer.createTransport({
		    service: 'Mailgun',
			  auth: { 
			  		user: 'postmaster@sandbox0635edeae6f641ebb9abccac5e396f54.mailgun.org', 
			  		//'ravishetty150@gmail.com',
			        pass: 'e2f670eefe44504724a607491d160cb5'
			        //'nmamitsucks' 
			    }
		});

		// setup e-mail data with unicode symbols
		var mailOptions = {
		    from: cont_name + "<" + cont_email + ">", // sender address
		    to: 'ravishetty150@gmail.com', // list of receivers
		    subject: cont_category , // Subject line
		    text: cont_descr, // plaintext body
		};

		// send mail with defined transport object
		transporter.sendMail(mailOptions, function(error, info){
		    if(error){
		        return console.log(error);
		    }
		    console.log('Message sent: ' + info.response);
		    res.render('users/contact_us',{title : 'suraj', email_sent : true });
		});
	});	

	app.post('/contact', function(req, res) {
	  var mailOpts, smtpTrans;
	  
		var EMAIL_TO_ENCRYPT = req.body.sub_email; // Email to encrypt.
		var encrypted = encrypt(EMAIL_TO_ENCRYPT); 
		var decrypted = decrypt(encrypted);
		console.log(encrypted); 
		console.log(decrypted);  

		var veri_link = "http://localhost:8000/verify/confirm/"+encrypted;
		var mobi_link = "http://192.168.43.59:8000/verify/confirm/"+encrypted;


			emailTemplates(templatesDir, function(err, template) {

		  if (err) {
		    console.log(err);
		  } else {

		    // ## Send a single email

		    // Prepare nodemailer transport object
			var transporter = nodemailer.createTransport(smtpTransport({
				  service: 'Mailgun',
				  auth: { 
				  		user: 'postmaster@sandbox0635edeae6f641ebb9abccac5e396f54.mailgun.org', 
				  		//'ravishetty150@gmail.com',
				        pass: 'e2f670eefe44504724a607491d160cb5'
				        //'nmamitsucks' 
				    }
				  }));

		    // An example users object with formatted email function
		    var locals = {
		      name : EMAIL_TO_ENCRYPT,
			  m_link : mobi_link,
			  p_link : veri_link
		    };

		    // Send a single email
		    template('subscribe', locals, function(err, html, text) {
		      if (err) {
		        console.log("template error : " +err);
		      } else {
		        transporter.sendMail({
		          from: "smtp.mailgun.org",
		          to: "<"+ EMAIL_TO_ENCRYPT +">",
		          subject: 'Subscription Confirmation',
		          html: html,
		          generateTextFromHTML: true,
		          text: text
		        }, function(err, responseStatus) {
		          if (err) {
		            console.log("some : " + err);
		          } else {
		          	
			      	  db.collection("temp").insert({email : EMAIL_TO_ENCRYPT},function(err,result){
						if(err){
							console.log("some error");
						}
						console.log("inserted");
					  });
		            console.log("SUCCESS : " +responseStatus.message);
		            res.redirect('/?email_sent=true')
		          }
		        });
		      }
		   });
		}
	});

});

	
	app.get('/newsletter_send', function(req, res) {
	  	var mailOpts, smtpTrans;

		emailTemplates(templatesDir, function(err, template) {

		  	if (err) {
		    	console.log(err);
		  	} else {

		    // ## Send a single email

		    // Prepare nodemailer transport object
			var transporter = nodemailer.createTransport(smtpTransport({
				  service: 'Mailgun',
				  auth: { 
				  		user: 'postmaster@sandbox0635edeae6f641ebb9abccac5e396f54.mailgun.org', 
				  		//'ravishetty150@gmail.com',
				        pass: 'e2f670eefe44504724a607491d160cb5'
				        //'nmamitsucks' 
				    }
			}));

			db.collection('email_sub',function(err,collection){
				collection.find(function(err,cursor){
					cursor.each(function(err,ob){
						if(ob != null){
							var locals = {
						      	name : ob.email
						    };
						    //var EMAIL = "ravishetty150@gmail.com"; // Email to send.
						    var EMAIL = ob.email; // Email to send.
						    // Send a newsletter
						    template('newsletter', locals, function(err, html, text) {
						      	if (err) {
						        	console.log("template error : " +err);
						      	} else {
						        	transporter.sendMail({
							          	from: "smtp.mailgun.org",
							          	to: "<"+ EMAIL +">",
							          	subject: 'Newsletter',
							          	html: html,
							          	generateTextFromHTML: true,
							          	text: text
						        	}, function(err, responseStatus) {
						          		if (err) {
						            		console.log("some : " + err);
						          		} else {
							            	console.log("SUCCESS : " +responseStatus.message);
							            	
						          		}
						        	});
						      	}
						   	});
						}
					});
					res.redirect('/?email_sent=true');
				});
			});
		    // An example users object with formatted email function		    
		}
	});

});












function checkincollection(name,str){
	var a = false;
	db.collection('temp',function(err,collection){
		collection.find(function(err,cursor){
			cursor.each(function(err,ob){
				if(ob != null){
					if(ob.email == token){
						a = true;
						console.log("value of inside a : " + a);
						return a;
					}
				}
			});
		});
	});
				console.log("value of a : " + a);
			return a;
}

//-------------------------------------------------------
	app.get('/verify/confirm/:token',function(req,res){
		var token = decrypt(req.params.token).toString('utf8');
		var subcribed = false;
		db.collection('temp', function(err, collection) {
	        collection.find(function(err, cursor) {
	            cursor.each(function(err, ob) {
	                if(ob != null){
						if(ob.email == token){
							subcribed = true;
							console.log("value of inside subscribe : " + subcribed);
							check();
							return subcribed;
						}
	                }else{
	                	if(subcribed != true){
	                		subcribed = false;
	                		console.log("value of else subscribe : " + subcribed);
	                		check();
	                		return subcribed;
	                	}
	                }
	            });
	        });
	    });
		
		
		function check(){

			if(subcribed == true){
				db.collection("email_sub").insert({email : token},function(err,result){
					if(err){
						res.redirect("/verify/subscription_error");
					}
					db.collection("temp").remove({email : token},function(err,results){
						res.redirect("/verify/subscription_confirmed");
					});
				});
				
			}else{
				res.redirect("/verify/subscription_denied");	
			}
		}

	});

	app.get('/verify/subscription_confirmed',function(req,res){
		res.write("you are in..");
		res.end();
	});

	app.get('/verify/subscription_denied',function(req,res){
		res.write("you are denied wtf..");
		res.end();
	});

	app.get('/verify/subscription_error',function(req,res){
		res.write("oops some error");
		res.end();
	});

    app.use(ErrorHandler);
}
