$(document).ready(function (e) {
	$('#upload_button').click(function () {
		$('#imageUploadForm').on('submit', function(e) {
	        e.preventDefault();
	        var formData = new FormData(this);

	        var image_path = $('#image_input').val();
	        console.log("selected::::" + image_path);
	        $('#sub_box').html('<p>Uploading Please wait ...</p>');
	        $.ajax({
	          type: 'post',
	          url: '/admin/image_upload/posts_short',
	          data: {
	            image_input: image_path
	          },
	          success: function(response){
	            console.log("Done ajax .. "+response);
	            $('#sub_box').html('
	              <div class="alert alert-info col-md-12 col-sm-12 col-xs-12 photo-box" id="photo-box2">
	                <a href="#" class="close" data-dismiss="alert" aria-label="close"> &times; </a>
	                <p>Image has been uploaded to Cloudinary </p>
	              </div>');
	          }
	        });
	        //input(type="button", class="btn btn-success", value="Upload" ,id="upload_button")
	        /*
	         form(role="form",class="image_upload")
              div(class="form-group")
                label(for="post_descr") Posts Other images
                input(type="file",class="form-control", name="filename", accept="image/gif, image/jpeg, image/png")
                p The extra images for the post
                div(class="main-container")
                  ul(class="flex-container")
                    div(class="alert alert-info col-md-12 col-sm-12 col-xs-12 photo-box", id="photo-box2")
                      p http://res.cloudinary.com/codejitsu/image/upload/v1436193764/Posts_full/default/960x540.jpg

                      script.
                        if(!{post_added} == true)
                          document.getElementById("photo-box").style.display = "block";

                object(data="/img/editors/asas.jpg", type="image/png",class="image")
                  img(id="blah",class="image", src="http://gsm24unlock.com/images/no_image.gif", alt="your image")
              button(type="submit", class="btn btn-success") Upload
             */          
	     });
	});
});
