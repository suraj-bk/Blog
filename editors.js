/* The EditorsDAO must be constructed with a connected database object */
function EditorsDAO(db) {
    "use strict";

    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof EditorsDAO)) {
        console.log('Warning: EditorsDAO constructor called without "new" operator');
        return new EditorsDAO(db);
    }

    var editors = db.collection("editors");
    var posts = db.collection("posts");

    
    this.getEditors = function(callback) {
        "use strict";

        editors.find().toArray(function(err, items) {
            "use strict";

            if (err) return callback(err, null);

            console.log("Found " + items.length + " editors");

            callback(err, items);
        });
    }

    this.getTotalEditors = function(){
        editors.count(function(error, nbDocs) {
            return nbDocs;
        });
    }

}

module.exports.EditorsDAO = EditorsDAO;
