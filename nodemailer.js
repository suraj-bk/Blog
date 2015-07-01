function subscribeButton(){
    alert("Testing..... 1");
    var nodemailer = require('nodemailer');
    alert("Testing..... 2");

    // create reusable transporter object using SMTP transport
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'ravishetty150@gmail.com',
            pass: 'nmamitsucks'
        }
    });

    // NB! No need to recreate the transporter object. You can use
    // the same transporter object for all e-mails

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: 'Ravi shetty ✔ <ravishetty150@gmail.com>', // sender address
        to: 'dkshthshetty7@gmail.com', // list of receivers
        subject: 'Hello ✔', // Subject line
        text: 'Hello world ✔', // plaintext body
        html: '<b>Hello world ✔</b>' // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        alert("Email has been sent");
        console.log('Message sent: ' + info.response);

    });
}    