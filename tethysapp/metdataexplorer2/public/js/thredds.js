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
               console.log(result);
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
                       url_wms,
                       url_subset,
                       epsg,
                       spatial,
                       description,
                       timestamp,
                       attributes,
                       metadata_td_file
                   } = server
                   let unique_id_group = uuidv4();
                   id_dictionary[unique_id_group] = title
                   let layers_style = {}
                   let new_title = unique_id_group;

                   let newHtml = html_for_servers(new_title,group_name_e3, attributes, url, url_wms, url_subset);
                   $(newHtml).appendTo(`#${id_group_separator}`);
                   let input_check_serv = $(`#${new_title}_check`);

                   input_check_serv.on("change", function(){
                     //ONLY ONE CHECKBOX AT A TIME//
                     $('input[type="checkbox"]').not(this).prop('checked', false);

                     //CLEAN TABLE //
                     $("#table_div").empty()
                    //MAKE DROPDOWN MENU FOR VARIABLES//
                    options_vars(attributes, new_title);
                    ///MAKE TABLE//

                    let table_content = get_table_vars(attributes,title);
                    // console.log(table_content);
                    $(table_content).appendTo("#table_div");

                    // MAKE THE BUTTON MODAL FOR THE INFORMATION OF THE FILE
                    for (let i = 0; i< attributes.length; ++i){
                      $(`#${attributes[i]['name']}_${title}_info`).on("click", function(){
                        $("#metadata_vars").empty();
                        console.log("hola");
                        let info_content = get_metadata_button(attributes[i]);
                        $(info_content).appendTo("#metadata_vars");
                      })

                      // DEFINE THE LAYER ATTRIBUTES //

                      let layernameUI = `${attributes[i]['name']}_${title}`
                      layers_style[layernameUI] = {}
                      layers_style[layernameUI]['opacity']= $("#opacity-slider").val();
                      layers_style[layernameUI]['wmsURL']= url_wms;
                      layers_style[layernameUI]['style'] = $('#wmslayer-style').val();
                      layers_style[layernameUI]['range'] = $('#wmslayer-bounds').val();
                      layers_style[layernameUI]['variable'] = attributes[i]['name'];
                      layers_style[layernameUI]['subset'] = url_subset;
                      layers_style[layernameUI]['opendap'] = url;
                      layers_style[layernameUI]['spatial'] = {};
                      layers_style[layernameUI]['epsg'] = epsg;
                      layers_style[layernameUI]['selected'] = false;
                      console.log(layers_style[layernameUI]);

                      // ADD AN EVENT TO THE CHECK THAT DISPLAYS THE MAP //
                      var check_id_var = `${attributes[i]['name']}_${title}_check`
                      let input_check = $(`#${check_id_var}`);

                      input_check.on("change", function(){
                        updateWMSLayer(layernameUI,layers_style[layernameUI]);
                        // only one check box at a time //
                        $('input[type="checkbox"]').not(this).prop('checked', false);

                      });

                      // ADD A EVENT LISTENER FOR THE OPCACITY IN THE LAYERS SETTINGS //
                      $("#opacity-slider").on("change", function(){
                        changeOpacity(layernameUI,this.value);
                        layers_style[layernameUI]['opacity']= $("#opacity-slider").val();
                      })


                    }
                  });


                   //
                   // $(`#${new_title}_variables`).on("click",showVariables2);
                   // $(`#${new_title}_variables_info`).on("click",hydroserver_information);
                   // $(`#${new_title}_${group_name_e3}_reload`).on("click",update_hydroserver);


                   // for (let i = 0; i< attributes.length; ++i){
                   //   console.log(attributes[i]['name']);
                   //   var check_id_var = `${attributes[i]['name']}_${new_title}_check`
                   //   let input_check = $(`#${check_id_var}`);
                   //   console.log(input_check);
                   //   let layernameUI = `${attributes[i]['name']}_${new_title}`
                   //   layers_style[layernameUI] = {}
                   //
                   //   layers_style[layernameUI]['opacity']= $("#opacity-slider").val();
                   //   layers_style[layernameUI]['wmsURL']= $(`#${new_title}_span`).attr("data-wms-url");
                   //   layers_style[layernameUI]['style'] = $('#wmslayer-style').val();
                   //   layers_style[layernameUI]['range'] = $('#wmslayer-bounds').val();
                   //   layers_style[layernameUI]['variable'] = attributes[i]['name'];
                   //   layers_style[layernameUI]['subset'] = $(`#${new_title}_span`).attr("data-subset-url");
                   //   layers_style[layernameUI]['opendap'] = $(`#${new_title}_span`).attr("data-opendap-url");
                   //   layers_style[layernameUI]['spatial'] = {};
                   //   layers_style[layernameUI]['epsg'] = epsg;
                   //   layers_style[layernameUI]['selected'] = false;
                   //   // array_services.push(layers_style[layernameUI]);
                   //   // console.log($(`#${new_title}`));
                   //   console.log(layers_style[layernameUI]);
                   //   input_check.on("change", function(){
                   //    updateWMSLayer(layernameUI,layers_style[layernameUI]);
                   //   })
                   //
                   // }



                   //
                     // input_check.addEventListener("change", function(){
                     //   let check_box = this;
                     //   if(layersDict['selectedPointModal']){
                     //     map.removeLayer(layersDict['selectedPointModal'])
                     //     map.updateSize()
                     //   }
                     //   if(layersDict['selectedPoint']){
                     //     map.removeLayer(layersDict['selectedPoint'])
                     //     map.updateSize()
                     //   }
                     //   map.getLayers().forEach(function(layer) {
                     //     if(layer_object_filter.hasOwnProperty(title) == false){
                     //       if(layer instanceof ol.layer.Vector && layer == layersDict[title]){
                     //         if(check_box.checked){
                     //
                     //           layer.setStyle(featureStyle(layerColorDict[title]));
                     //         }
                     //         else{
                     //           layer.setStyle(new ol.style.Style({}));
                     //
                     //         }
                     //       }
                     //     }
                     //     else{
                     //       if(layer instanceof ol.layer.Vector && layer == layer_object_filter[title]){
                     //         if(check_box.checked){
                     //
                     //           layer.setStyle(featureStyle(layerColorDict[title]));
                     //         }
                     //         else{
                     //           layer.setStyle(new ol.style.Style({}));
                     //         }
                     //       }
                     //     }
                     //    });
                     //
                     // });
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
               console.log(e);
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
             console.log(error);
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


var get_table_vars = function(attributes,title){
  let table_content = '<table id = "table_vars" class="table table-hover table-condensed"><thead><tr>'

  let var_metad = attributes[0];
  // MAKE THE HEADERS FIRST //
  Object.keys(var_metad).forEach(function(key) {
    if(key =="name"){
      table_content += `<th >${key}</th>`;
      table_content += `<th >Display</th>`;
    }
    if(key != "metadata_var" && key != "color" && key != "name" ){
      table_content += `<th>${key}</th>`;
    }

  });

  // CLOSE HEADER //
  table_content += "</tr></thead>"
    // ADD ROWS //
    table_content += "<tbody>"
    for (let i = 0; i< attributes.length; ++i){
      table_content += "<tr>";
      let var_metad = attributes[i];
      // MAKE THE HEADERS FIRST //
      Object.keys(var_metad).forEach(function(key) {
        if(key =="name"){
          let fixed_name = var_metad[key].replace(/_/g, ' ')
          table_content += `<td >${fixed_name}</td>`;
          table_content += `<td>
                    <input id = "${var_metad[key]}_${title}_check" class="chkbx-variables" type="checkbox" value = "${var_metad[key]}">
                    <button class="btn btn-primary btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalStyleInfo">
                      <i class="fas fa-layer-group"></i>
                    </button>
                    <button id = "${var_metad[key]}_${title}_info" class="btn btn-primary btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalMetaDataInfo">
                        <i class="fas fa-info-circle"></i>
                    </button>
          </td>`;
        }
        if(key != "metadata_var" && key != "color" && key != "name" ){

          table_content += `<td>${var_metad[key]}</td>`;
        }

          // else{
          //     table_content += `<td>${var_metad[key]}</td>`;
          // }
      });


      table_content += "</tr>";
    }

    table_content += "</tbody> </table>"
    return table_content


}

var get_metadata_button = function(attribute){
  let table_content = '<table id = "table_metadata" class="table table-hover table-responsive table-sm"><thead><tr>'
  table_content += '<th>Property</th><th>Value</th></tr></thead><tbody>'
  let var_metad = JSON.parse(attribute['metadata_var']);
  let all_vars_keys = Object.keys(var_metad);

  for(let j = 0; j< all_vars_keys.length; ++j){
    table_content += `<tr><td>${all_vars_keys[j]}</td><td>${var_metad[all_vars_keys[j]]}</td></tr>`
  }
  table_content += "</tbody> </table>"
  return table_content
}

var get_all_the_var_metadata = function(attributes){
  let table_content = '<table id = "table_vars" class="table table-hover table-responsive table-sm"><thead><tr>'

  let unique_headers = [];

  for (let i = 0; i< attributes.length; ++i){
    let var_metad = JSON.parse(attributes[i]['metadata_var']);
    // MAKE THE HEADERS FIRST //
    Object.keys(var_metad).forEach(function(key) {
      if(unique_headers.includes(key) == false){
        unique_headers.push(key);
        table_content += `<th >${key}</th>`;
      }
    });

  }
  // CLOSE HEADER //
  table_content += "</tr></thead>"

  // ADD ROWS //
  table_content += "<tbody>"
  for (let i = 0; i< attributes.length; ++i){
    table_content += "<tr>";
    console.log(attributes[i]);
    let var_metad = JSON.parse(attributes[i]['metadata_var']);
    // MAKE THE HEADERS FIRST //
    let all_vars_keys = Object.keys(var_metad);
    for(let j = 0; j< all_vars_keys.length; ++j ){
      if(var_metad[all_vars_keys[j]]){
        table_content += `<td>${var_metad[all_vars_keys[j]]}</td>`
      }
      else{
        table_content += `<td> </td>`

      }
    }
    table_content += "</tr>";
  }

  table_content += "</tbody> </table>"
  return table_content
}
