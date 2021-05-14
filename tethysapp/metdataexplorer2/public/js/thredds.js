var THREDDS_PACKAGE = (function(){

  $(function(){

  })

})()


var load_individual_thredds_for_group = function(group_name){
   let group_name_obj={
     group: group_name
   };
   $("#GeneralLoading").css({
      position:'fixed',
      "z-index": 9999,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    });
   $("#GeneralLoading").removeClass("hidden");
       $.ajax({
           type: "GET",
           url: `load-group/`,
           dataType: "JSON",
           data: group_name_obj,
           success: result => {
             try{
               let servers = result["thredds"]
               //USE A FUNCTION TO FIND THE LI ASSOCIATED WITH THAT GROUP  AND DELETE IT FROM THE MAP AND MAKE ALL
               // THE CHECKBOXES VISIBLE //
               let group_name_e3;
               Object.keys(id_dictionary).forEach(function(key) {
                 if(id_dictionary[key] == group_name ){
                   group_name_e3 = key;
                 }
               });
               let id_group_separator = `${group_name_e3}_list_separator`;

               if(servers.length <= 0){
                 $(`#${group_name_e3}-noGroups`).show();
               }
               else{
                  $(`#${group_name_e3}-noGroups`).hide();
               }

               servers.forEach(function(server){
                   let {
                       title,
                       url,
                       epsg,
                       spatial,
                       description,
                       timestamp
                   } = server
                   let unique_id_group = uuidv4();
                   id_dictionary[unique_id_group] = title

                   let new_title = unique_id_group;
                   let newHtml = html_for_servers(new_title,group_name_e3);
                   $(newHtml).appendTo(`#${id_group_separator}`);
                   //
                   // $(`#${new_title}_variables`).on("click",showVariables2);
                   // $(`#${new_title}_variables_info`).on("click",hydroserver_information);
                   // $(`#${new_title}_${group_name_e3}_reload`).on("click",update_hydroserver);

                   // let lis = document.getElementById(`${id_group_separator}`).getElementsByTagName("li");
                   // let li_arrays = Array.from(lis);
                   // let li_arrays2 = Array.from(lis);
                   //
                   // let input_check = li_arrays.filter(x => new_title === x.attributes['layer-name'].value)[0].getElementsByClassName("chkbx-layer")[0];
                   //
                   //
                   //   input_check.addEventListener("change", function(){
                   //     let check_box = this;
                   //     if(layersDict['selectedPointModal']){
                   //       map.removeLayer(layersDict['selectedPointModal'])
                   //       map.updateSize()
                   //     }
                   //     if(layersDict['selectedPoint']){
                   //       map.removeLayer(layersDict['selectedPoint'])
                   //       map.updateSize()
                   //     }
                   //     map.getLayers().forEach(function(layer) {
                   //       if(layer_object_filter.hasOwnProperty(title) == false){
                   //         if(layer instanceof ol.layer.Vector && layer == layersDict[title]){
                   //           if(check_box.checked){
                   //
                   //             layer.setStyle(featureStyle(layerColorDict[title]));
                   //           }
                   //           else{
                   //             layer.setStyle(new ol.style.Style({}));
                   //
                   //           }
                   //         }
                   //       }
                   //       else{
                   //         if(layer instanceof ol.layer.Vector && layer == layer_object_filter[title]){
                   //           if(check_box.checked){
                   //
                   //             layer.setStyle(featureStyle(layerColorDict[title]));
                   //           }
                   //           else{
                   //             layer.setStyle(new ol.style.Style({}));
                   //           }
                   //         }
                   //       }
                   //      });
                   //
                   //   });
                   //
                   //   let sites = siteInfo
                   //   if (typeof(sites) == "string"){
                   //     sites = JSON.parse(siteInfo);
                   //   }
                   //   var vectorLayer = map_layers(sites,title,url)[0]
                   //   var vectorSource = map_layers(sites,title,url)[1]
                   //
                   //   let test_style = new ol.style.Style({
                   //     image: new ol.style.Circle({
                   //       radius: 10,
                   //       stroke: new ol.style.Stroke({
                   //         color: "white",
                   //       }),
                   //       fill: new ol.style.Fill({
                   //         color: layerColorDict[title],
                   //       }),
                   //     })
                   //   });
                   //   let rowHTML= `<tr id= ${new_title}-row-complete>
                   //                  <th id="${new_title}-row-legend"></th>
                   //                  <th>${title}</th>
                   //                </tr>`
                   //  if(!document.getElementById(`${new_title}-row-complete`)){
                   //    $(rowHTML).appendTo('#tableLegend');
                   //  }
                   //  $(`#${new_title}-row-legend`).prepend($(getIconLegend(test_style,title)));
                   //
                   //
                   //   map.addLayer(vectorLayer);
                   //   vectorLayer.setStyle(new ol.style.Style({}));
                   //
                   //
                   //   vectorLayer.set("selectable", true)
                   //
                   //   layersDict[title] = vectorLayer;
                   //   $(`#${new_title}_zoom`).on("click",function(){
                   //     if(layersDict['selectedPointModal']){
                   //       map.removeLayer(layersDict['selectedPointModal'])
                   //       map.updateSize();
                   //     }
                   //     if(layersDict['selectedPoint']){
                   //       map.removeLayer(layersDict['selectedPoint'])
                   //       map.updateSize();
                   //     }
                   //     map.getView().fit(vectorSource.getExtent());
                   //     map.updateSize();
                   //     map.getLayers().forEach(function(layer) {
                   //       if (!(title in layer_object_filter)){
                   //         if(layer instanceof ol.layer.Vector && layer == layersDict[title]){
                   //           layer.setStyle(featureStyle(layerColorDict[title]));
                   //         }
                   //       }
                   //       else{
                   //         if(layer instanceof ol.layer.Vector && layer == layer_object_filter[title]){
                   //           layer.setStyle(featureStyle(layerColorDict[title]));
                   //         }
                   //       }
                   //
                   //      });
                   //     input_check.checked = true;
                   //   });
               })
               $("#GeneralLoading").addClass("hidden");
             }
             catch(e){
               $("#GeneralLoading").addClass("hidden");
               $.notify(
                   {
                       message: `Something went wrong loading the THREDDS for the group called ${group_name}.`
                   },
                   {
                       type: "danger",
                       allow_dismiss: true,
                       z_index: 20000,
                       delay: 5000,
                       animate: {
                         enter: 'animated fadeInRight',
                         exit: 'animated fadeOutRight'
                       },
                       onShow: function() {
                           this.css({'width':'auto','height':'auto'});
                       }
                   }
               )
             }



           },
           error: function(error) {
             $("#GeneralLoading").addClass("hidden");
               $.notify(
                   {
                       message: `Something went wrong loading the THREDDS for the group called ${group_name}.`
                   },
                   {
                       type: "danger",
                       allow_dismiss: true,
                       z_index: 20000,
                       delay: 5000,
                       animate: {
                         enter: 'animated fadeInRight',
                         exit: 'animated fadeOutRight'
                       },
                       onShow: function() {
                           this.css({'width':'auto','height':'auto'});
                       }
                   }
               )
           }
       })
 };
