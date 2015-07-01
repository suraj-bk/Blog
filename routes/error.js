// Error handling middleware

exports.errorHandler = function(err, req, res, next) {
    "use strict";
    console.error(err.message);
    console.error(err.stack);
    res.status(500);
    res.write("Page not found");
    res.end();
    //res.render('error_template', { error: err });
}
