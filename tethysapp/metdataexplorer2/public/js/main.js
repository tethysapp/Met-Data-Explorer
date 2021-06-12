var MET_DATA_EXPLORER_PACKAGE = (function(){

  $(function(){
    $("#btn-info-epsg").on("click", function(){
      if($("#info-epsg").attr("class") == "hidden"){
        $("#info-epsg").removeClass("hidden");
      }
      else{
        $("#info-epsg").addClass("hidden");
      }

    })

    load_groups_start();
  })

})()
