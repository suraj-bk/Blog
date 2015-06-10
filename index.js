var express = require('express')
	,stylus = require('stylus')
	,nib = require('nib');



var app = express();
function compile(str,path){
	return stylus(str)
	.set('filename',path)
	.use(nib())
}
//setting views folder
app.set('views',__dirname + '/views');
//set default engine to jade
app.set('view engine','jade');

//Middleware
//app.use(express.logger('dev'));
app.use(stylus.middleware({
	src: __dirname + '/public'
	,compile:compile
}
))
app.use(express.static(__dirname + '/public'));





//Defining the routes
app.get('/',function(req, res){
	res.render('users/index',{title : 'suraj'});
});
app.listen(7777);
console.log("Server running on port : " + '7777');