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
    $("#btn-info-epsg2").on("click", function(){
      if($("#info-epsg2").attr("class") == "hidden"){
        $("#info-epsg2").removeClass("hidden");
      }
      else{
        $("#info-epsg2").addClass("hidden");
      }
    })
    $("#btn-info-tdsURL").on("click", function(){
      if($("#info-tdsURL").attr("class") == "hidden"){
        $("#info-tdsURL").removeClass("hidden");
      }
      else{
        $("#info-tdsURL").addClass("hidden");
      }
    })
    $("#extra_dim").selectpicker('hide');
    load_groups_start();
  })
})()
