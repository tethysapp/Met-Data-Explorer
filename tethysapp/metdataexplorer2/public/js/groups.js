var GROUPS_PACKAGE = (function(){


  $('#btn-uplevel').click(function () {
      if (URLpath.length !== 1) {
          let newURL = URLpath[URLpath.length - 2];
          $('#url').val(newURL);
          getFoldersAndFiles(newURL);
          URLpath.pop();
      }
  })
  $(function(){
    $("#btn-check_available_serv").on("click",function(){
      getFoldersAndFiles()
    })
  })

})()
