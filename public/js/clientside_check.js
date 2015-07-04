function checkEmail(){
  var cont_email = document.getElementById("cont_email").value;
  var p = cont_email.search(/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/);

  if(p == -1){
    document.getElementById("email-alert").style.display = "block";
    document.getElementById("cont_email").value="";
    document.getElementById("cont_email").focus();
    document.getElementById("cont_email").select();
    return false;
  }else{
    return true;
  }
}