var LocalStrategy   = require('passport-local').Strategy;
var User = require('../models/user');
var Writer = require('../models/writer');
var bCrypt = require('bcrypt-nodejs');

module.exports = function(passport){

	passport.use('signup', new LocalStrategy({
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {

            findOrCreateUser = function(){
                // find a user in Mongo with provided username
                User.findOne({ 'username' :  username }, function(err, user) {
                    // In case of any error, return using the done method
                    if (err){
                        console.log('Error in SignUp: '+err);
                        return done(err);
                    }
                    // already exists
                    if (user) {
                        console.log('User already exists with username: '+username);
                        return done(null, false, req.flash('message','User Already Exists'));
                    } else {
                        // if there is no user with that email
                        // create the user
                        var newUser = new User();

                        // set the user's local credentials
                        newUser.username = username;
                        newUser.password = createHash(password);
                        newUser.email = req.param('email');
                        newUser.firstName = req.param('firstName');
                        newUser.lastName = req.param('lastName');
                        newUser.group = "admin";

                        // save the user
                        newUser.save(function(err) {
                            if (err){
                                console.log('Error in Saving user: '+err);  
                                throw err;  
                            }
                            console.log('User Registration succesful');    
                            return done(null, newUser);
                        });
                    }
                });
            };
            // Delay the execution of findOrCreateUser and execute the method
            // in the next tick of the event loop
            process.nextTick(findOrCreateUser);
        })
    );

    passport.use('signupWriter', new LocalStrategy({
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {

            findOrCreateWriter = function(){
                // find a user in Mongo with provided username
                Writer.findOne({ 'username' :  username }, function(err, user) {
                    // In case of any error, return using the done method
                    if (err){
                        console.log('Error in SignUp: '+err);
                        return done(err);
                    }
                    // already exists
                    if (user) {
                        console.log('Writer already exists with username: '+username);
                        return done(null, false, req.flash('message','Writer Already Exists'));
                    } else {
                        // if there is no user with that email
                        // create the user
                        var newWriter = new Writer();

                        // set the user's local credentials
                        newWriter.username = username;
                        newWriter.password = createHash(password);
                        newWriter.email = req.param('email');
                        newWriter.firstName = req.param('firstName');
                        newWriter.lastName = req.param('lastName');
                        newWriter.group = "writer";

                        // save the user
                        newWriter.save(function(err) {
                            if (err){
                                console.log('Error in Saving user: '+err);  
                                throw err;  
                            }
                            console.log('Writer Registration succesful');    
                            return done(null, newWriter);
                        });
                    }
                });
            };
            // Delay the execution of findOrCreateWriter and execute the method
            // in the next tick of the event loop
            process.nextTick(findOrCreateWriter);
        })
    );


    // Generates hash using bCrypt
    var createHash = function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    }

}