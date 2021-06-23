
var VARIABLES_PACKAGE = (function(){

  $(function(){
    $("#btn-add-addVariables").on("click",addVariablesToTD);
    $("#btn-del-variables").on("click",deleteVariablesToTD);
    $("#update_graphs").on("click",getFullArray);
    $("#spatial_input").on("change", function(){
      let method_draw = $(this).val();
      chosen_method_spatial(method_draw)
    })
    $("#show_wms").change(myWMS_display);
    $("#variables_graph").on("change", function(){
      let actual_state=$("#show_wms").prop('checked');
      if(actual_state){
        myWMS_display()
      }
    })
    $("#variable_met_info").on("click", function(){
      let tdds_e3;
      console.log(current_tdds);
      console.log(id_dictionary);
      Object.keys(id_dictionary).forEach(function(key) {
        if(id_dictionary[key] == `${current_tdds}_join_${current_Group}` ){
          tdds_e3 = key;
        }
      });
      let id_vari = `${$("#variables_graph").val()}_${tdds_e3}_info`;

      // $(`#${id_vari}`).on("click", function(){
        $("#metadata_vars").empty();
        let info_content = get_metadata_button(attr[i]);
        $(info_content).appendTo("#metadata_vars");
    });

    $("#btn-geo_link").on("click", function(){
      input_spatial = $("#geoServer_link").val();
      console.log(input_spatial);
      $.ajax({
          type: "GET",
          url: input_spatial,
          dataType: "json",
          success: function(result) {
            console.log(result);
            var myStyle = {
                "color": "#E2E5DE",
                "weight": 5,
                "opacity": 0.5
            };

            jsonLayer = L.geoJSON(result, {
                style: myStyle
            })
            jsonLayer.addTo(mapObj);
            mapObj.flyToBounds(jsonLayer.getBounds());
          }
      })

    })
    $("#download_dropdown").on("change", function(){
      let method_download = $(this).val();
      console.log(method_download);
      download_Methods(method_download);
    })
    $("#get_data_values").on("click", get_data_bounds);
    $("#apply_config").on("click",apply_style_config);

  })

})()

var apply_style_config = function(){
  var range = $("#wmslayer-bounds").val();
  var opacity = $("#wmslayer-style").val();
  var colorStyle = $("#wmslayer-style").val();
  myWMS_display();
}

var get_data_bounds = function(){
  let variable_active = $("#variables_graph").val();
  let json_request = {
    variable: variable_active,
    group: current_Group,
    tdds: current_tdds
  }
  console.log(json_request);
  $('#GeneralLoading').removeClass('hidden');

  $.ajax({
      type: "POST",
      url: `get-data-bounds/`,
      data: json_request,
      dataType: "json",
      success: function(result) {
        $("#wmslayer-bounds").val(result['range']);
        // console.log(result);
        $('#GeneralLoading').addClass('hidden');
        $.notify(
            {
                message: `Bounds were succesfully retrieved`
            },
            {
                type: "success",
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
      },
      error:function(e){
        $('#GeneralLoading').addClass('hidden');
        console.log(e);
        $.notify(
            {
                message: `There was an error retrieving the data bounds`
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
}


var download_Methods = function(method_download){
  if(method_download == 'CSV'){
    console.log("csv");
    var csvData = [];
    // var csvData_temp = [];

    var header = [] //main header.
    Object.keys(values_donwload_json).forEach(function(key) {
        header.push(key);
        // let temp_arr = [];
        // Object.key(values_donwload_json[key]).forEach(function(key2){
        //   temp_arr.push(values_donwload_json[key][key2]);
        // })
        // csvData_temp.push(temp_arr);
    });
    csvData.push(header);
    // for (let i= 0; i< csvData_temp.length; ++i){
    //   var line = [];
    //   for (let j= 0; j< csvData_temp[i].length; ++j){
    //     csvData_temp[i][j]
    //   }
    // }

    for (let i = 0; i < Object.keys(values_donwload_json['datetime']).length; i++) {
      let row = []
      for (let r = 0; r < header.length; r++) {
          row.push(values_donwload_json[header[r]][i]);
      }
      csvData.push(row);

    }

    var csvFile = csvData.map(e=>e.map(a=>'"'+((a||"").toString().replace(/"/gi,'""'))+'"').join(",")).join("\r\n"); //quote all fields, escape quotes by doubling them.
    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${$("#variables_graph").val()}` + ".csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    $.notify(
        {
            message: `Download completed for the ${$("#variables_graph").val()} variable in CSV format`
        },
        {
            type: "sucess",
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
  if(method_download == 'JSON'){

    var dataStr = JSON.stringify(values_donwload_json,null,2);

    var blob = new Blob([dataStr], { type: 'text/json;charset=utf-8;' });
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", $("#variables_graph").val() + ".json");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    $.notify(
        {
            message: `Download completed for the ${$("#variables_graph").val()} variable in JSON format`
        },
        {
            type: "sucess",
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
  if(method_download == 'xml'){
    // console.log("xml");
    // console.log(values_donwload_json);
    // var dataStr = parser.parse(values_donwload_json);
    // console.log(dataStr);
    // var blob = new Blob([dataStr], { type: 'application/octet-stream;' });
    // var link = document.createElement("a");
    // var url = URL.createObjectURL(blob);
    // link.setAttribute("href", url);
    // link.setAttribute("download", $("#variables_graph").val() + ".json");
    // link.style.visibility = 'hidden';
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
    $.notify(
        {
            message: `We are still working in these feature :)`
            // message: `Download completed for the ${$("#variables_graph").val()} variable in XML format`
        },
        {
            type: "sucess",
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
}

var myWMS_display = function(){
  let tdds_e3;
  console.log(current_tdds);
  console.log(current_Group);
  console.log(id_dictionary);
  Object.keys(id_dictionary).forEach(function(key) {
    if(id_dictionary[key] == `${current_tdds}_join_${current_Group}` ){
      tdds_e3 = key;
      console.log(tdds_e3);
    }
  });
  let layernameUI = `${$("#variables_graph").val()}_${tdds_e3}`;
  console.log(layernameUI);
  layers_dict_wms[layernameUI]['style'] = $('#wmslayer-style').val();
  layers_dict_wms[layernameUI]['range'] = $('#wmslayer-bounds').val();
  updateWMSLayer(layernameUI,layers_dict_wms[layernameUI]);

  console.log(layers_dict_wms);
}
var chosen_method_spatial = function(method_draw){
  console.log(method_draw);
  if(method_draw == 'draw_map'){
    $(".leaflet-draw-section").show();
    mapObj.removeLayer(jsonLayer);
  }
  if(method_draw == 'upload_shp'){
    $(".leaflet-draw-section").hide();
    $('#externalSPTL_modal').modal("show");
    drawnItems.clearLayers();
    mapObj.removeLayer(jsonLayer);
  }
  if(method_draw == 'geoserv_link'){
    console.log("holis");
    $(".leaflet-draw-section").hide();
    $('#Geo_link_modal').modal("show");
    drawnItems.clearLayers();
  }


}

var drawGraphTwo = function() {
    let timeseriesVariable = false;
    let timeseriesFeature = false;
    $('.timeseries-variable').each(function () {
        if ($(this).attr('data-selected') == 'true') {
            timeseriesVariable = $(this).attr('data-variable');
        }
    })
    $('.timeseries-features').each(function () {
        if ($(this).attr('data-selected') == 'true') {
            timeseriesFeature = $(this).attr('data-feature');
        }
    })
    let series = {};
    console.log('timeseries')
    console.log(fullArrayTimeseries[timeseriesVariable])
    series['timeseries'] = fullArrayTimeseries[timeseriesVariable]['datetime'];
    series['mean'] = fullArrayTimeseries[timeseriesVariable][timeseriesFeature];
    let x = [];
    let y = [];
    for (let i = 0; i < Object.keys(series['timeseries']).length; i++) {
        x.push(series['timeseries'][i]);
        y.push(series['mean'][i]);
    }
    let variable = $('#variable-input').val();
    let layout = {
        title: 'Mean of ' + variable,
        xaxis: {title: 'Time', type: 'datetime'},
        yaxis: {title: 'Amount'}
    };
    let values = {
        x: x,
        y: y,
        mode: 'lines+markers',
        type: 'scatter'
    };
    Plotly.newPlot('chart-two', [values], layout);
    let chart = $("#chart-two");
    Plotly.Plots.resize(chart[0]);
}



var deleteVariablesToTD = function(){
  let $modalAddVars = $("#modalDeleteVariable");
  var datastring = $modalAddVars.serialize();
  datastring += `&actual-group=${current_Group}`
  datastring += `&actual-tdds=${current_tdds}`
  console.log(datastring);
  $.ajax({
      type: "POST",
      url: `delete-vars/`,
      data: datastring,
      dataType: "HTML",
      success: function(result) {

        console.log(result);
        let variables_to_del = JSON.parse(result)['var_list'];
        let new_title;
        Object.keys(id_dictionary).forEach(function(key) {
          if(id_dictionary[key] == `${current_tdds}_join_${current_Group}` ){
            new_title = key;
          }
        });
        variables_to_del.forEach(function(single_var){
          $(`#${single_var}deleteID`).remove();
          let layernameUI = `${single_var}_${new_title}`
          removeActiveLayer(layernameUI);
        });

      },
      error:function(e){

      }
    })
}

var addVariablesToTD = function(){
  let units = 'false';
  let color = 'false';
  let attr = {};
  $('.attr-checkbox').each(function () {
      if (this.checked) {
          let var_string = $(this).val().split('_a_')[0];
          let allDimensions = [];
          var x = document.getElementById(`${var_string}_time`);
          if(x != null){
            var i;
            for (i = 0; i < x.length; i++) {
                allDimensions.push(x.options[i].text);
            }
            attr[var_string] = {
                name: var_string,
                dimensions: allDimensions,
                units: units,
                color: color,
            }
          }
          else{
            let time = '';
            let location = '';
            if ($(`#${var_string}_time`).val() == '') {
                time = false;
            } else {
                time = $(`#${var_string}_time`).val();
            }
            if ($(`#${var_string}_location`).val() == '') {
                location = [false, false];
            } else {
                lat = $(`#${var_string}_location`).val();
            }
            attr[var_string] = {
                name: var_string,
                dimensions: `${time},${location[0]},${location[1]}`,
                units: units,
                color: color,
            }
          }
      }
  })
  let json_request = {
    attributes: JSON.stringify(attr),
    current_tdds: current_tdds,
    current_group:current_Group
  }
  $.ajax({
      type: "POST",
      url: `add-vars/`,
      data: json_request,
      dataType: "json",
      success: function(result) {

        let attr2 = JSON.parse(result['all_attr']);
        let current_tdds_id;
        Object.keys(id_dictionary).forEach(function(key) {
            if(id_dictionary[key].split('_join_')[0] == current_tdds){
              current_tdds_id = key;
            }
        })


        if( current_tdds_id == tdds_displaying_metadata){
          let table_content = $('#table_var_body').html().split('</tbody>')[0];
          Object.keys(attr).forEach(function(single_att_key) {

          // for (let i = 0; i< attr.length; ++i){
            table_content += "<tr>";
            // let var_metad = attr[i];
            let var_metad = attr[single_att_key];
            // MAKE THE HEADERS FIRST //
            Object.keys(var_metad).forEach(function(key) {
              if(key =="name"){
                let fixed_name = var_metad[key].replace(/_/g, ' ')
                table_content += `<td >${fixed_name}</td>`;
                table_content += `<td>
                          <input id = "${var_metad[key]}_${current_tdds}_check" class="chkbx-variables" type="checkbox" value = "${var_metad[key]}">
                          <button class="btn btn-primary btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalStyleInfo">
                            <i class="fas fa-layer-group"></i>
                          </button>
                          <button id = "${var_metad[key]}_${current_tdds}_info" class="btn btn-primary btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalMetaDataInfo">
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
          })
          table_content += "</tbody>"
          console.log(table_content)
          $("#table_var_body").empty();

          $(table_content).appendTo("#table_var_body");

        }
        // for (let i = 0; i< attr.length; ++i){
        Object.keys(attr).forEach(function(single_att_key) {

          $(`#${attr[single_att_key]['name']}_${new_title}_info`).on("click", function(){
            $("#metadata_vars").empty();
            let info_content = get_metadata_button(attr[single_att_key]);
            $(info_content).appendTo("#metadata_vars");
          })

          // DEFINE THE LAYER ATTRIBUTES //

          let layernameUI = `${attr[single_att_key]['name']}_${current_tdds_id}`
          layers_style[layernameUI] = {}
          layers_style[layernameUI]['title'] = attr[single_att_key]['name'];
          layers_style[layernameUI]['opacity']= $("#opacity-slider").val();
          layers_style[layernameUI]['wmsURL']= url_wms;
          layers_style[layernameUI]['style'] = $('#wmslayer-style').val();
          layers_style[layernameUI]['range'] = $('#wmslayer-bounds').val();
          layers_style[layernameUI]['variable'] = attr[single_att_key]['name'];
          layers_style[layernameUI]['subset'] = url_subset;
          layers_style[layernameUI]['opendap'] = url;
          layers_style[layernameUI]['spatial'] = {};
          layers_style[layernameUI]['epsg'] = epsg;
          layers_style[layernameUI]['selected'] = false;
          // console.log(layers_style[layernameUI]);

          // ADD AN EVENT TO THE CHECK THAT DISPLAYS THE MAP //
          var check_id_var = `${attr[single_att_key]['name']}_${current_tdds_id}_check`
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


        });

        //ADD event listener to display the modality after each click in the info logo///
        let input_check_serv = $(`#${new_title}_check`);
        input_check_serv.on("click", function(){
           //CLEAN TABLE //
           $("#table_div").empty()
          //MAKE DROPDOWN MENU FOR VARIABLES//
          options_vars(attr_array, new_title);
          ///MAKE TABLE//

          let table_content = get_table_vars(attr_array,new_title);
          // console.log(table_content);
          $(table_content).appendTo("#table_div");

          // MAKE THE BUTTON MODAL FOR THE INFORMATION OF THE FILE
          for (let i = 0; i< attr2.length; ++i){
            $(`#${attr2[i]['name']}_${new_title}_info`).on("click", function(){
              $("#metadata_vars").empty();
              let info_content = get_metadata_button(attr2[i]);
              $(info_content).appendTo("#metadata_vars");
            })

            // DEFINE THE LAYER ATTRIBUTES //

            let layernameUI = `${attr[i]['name']}_${new_title}`;

            // ADD AN EVENT TO THE CHECK THAT DISPLAYS THE MAP //
            var check_id_var = `${attr2[i]['name']}_${new_title}_check`
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

        $.notify(
            {
              message: `The Addition of Variables was Sucessful.`
            },
            {
                type: "success",
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
      },
      error:function(e){
        console.log(e);
        $.notify(
            {
              message: `There was an error while adding the variables to the Tredds file.`
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
}


var getTimeseries = function(coord, subsetURL_tempt) {
     if (subsetURL_tempt['opendapURL'] == '') {
         console.log('Please select a data layer.');
     } else {
         // $('#loading-modal').modal('show');
         var maxlat = coord[0][2].lat;
         var maxlng = coord[0][2].lng;
         var minlat = coord[0][0].lat;
         var minlng = coord[0][0].lng;
         var vars = $('#variable-input').val();
         var time = $('#time').val();
         var subsetUrlFull = `${subsetURL_tempt}?var=${vars}&north=${maxlat}&west=${minlng}&east=${maxlng}&south=${minlat}&disableProjSubset=on&horizStride=1&temporal=all`;
         $.ajax({
             url: URL_getBoxValues,
             data: {
                 'subsetURL': subsetUrlFull,
                 'var': vars,
                 'time': time,
             },
             dataType: 'json',
             contentType: "application/json",
             method: 'GET',
             success: function (result) {
                 var data = result['data'];
                 if (data == false) {
                     $('#loading-modal').modal('hide');
                     alert('Invalid dimensions');
                 } else {
                     drawGraph(data);
                     $('#loading-modal').modal('hide');
                     $('#timeseries-modal').modal('show');
                 }
             },
         });
     }
 }


var getSingleTS = function(){
  $.ajax({
      url: 'getSingle-TS',
      data: {
          'containerAttributes': JSON.stringify(containerAttributes),
      },
      dataType: 'json',
      contentType: "application/json",
      method: 'GET',
      success: function (result) {
          let data = result['result'];
          let timeseries = {};
          let htmlVariables = '';
          let i = 1;
          for (let key in data) {
              timeseries[key] = JSON.parse(data[key])
              if (i == 1) {
                  htmlVariables += `<div class="timeseries-variable" data-variable="${key}" onclick="updateSelectedVariable.call(this)" data-selected="true" style="background-color: #4532fc;"><p style="color: white">${key}</p></div>`;
              } else {
                  htmlVariables += `<div class="timeseries-variable" data-variable="${key}" onclick="updateSelectedVariable.call(this)" data-selected="false"><p>${key}</p></div>`;
              }
              i += 1;
          }
          i = 1;
          let htmlFeatures = '';
          for (let feature in timeseries[Object.keys(timeseries)[0]]) {
              if (feature !== 'datetime') {
                  if (i == 1) {
                      htmlFeatures += `<div class="timeseries-features" onclick="updateSelectedFeature.call(this)" data-feature="${feature}" data-selected="true" style="background-color: #4532fc;"><p style="color: white">${feature}</p></div>`;
                  } else {
                      htmlFeatures += `<div class="timeseries-features" onclick="updateSelectedFeature.call(this)" data-feature="${feature}" data-selected="false"><p>${feature}</p></div>`;
                  }
                  i += 1;
              }
          }
          fullArrayTimeseries = timeseries;
          $('#timeseries-variable-div').empty().append(htmlVariables);
          $('#timeseries-feature-div').empty().append(htmlFeatures);
          $('#full-array-modal').modal('show');
          $('#loading-modal').modal('hide');
          drawGraphTwo();
      },
  });
}


var getFullArray= function() {
    // console.log($("#variables_graph").val());
    let request_obj = {
      group: current_Group,
      tds: current_tdds,
      attr_name:$("#variables_graph").val(),
      input_sptl: input_spatial
    }

    console.log(request_obj);

   let type_drawing = $("#spatial_input").val();
   let var_val = $("#variables_graph").val();
   if(type_drawing != "sptial_in" &&  var_val != "select_val"){
     $('#GeneralLoading').removeClass('hidden');

     $.ajax({
         url: "getFullArray/",
         data: request_obj,
         dataType: 'json',
         contentType: "application/json",
         method: 'GET',
         success: function (result) {
           try{
             let data = result['result'];
             let timeseries = {};
             let htmlVariables = '';
             let i = 1;
             for (let key in data) {
                 timeseries[key] = JSON.parse(data[key]);
                 values_donwload_json = timeseries[key];
                 console.log(timeseries[key]);
                 console.log(Object.keys(timeseries[key]).length);
                 if(Object.keys(timeseries[key]).length <= 2 ){
                   let xArray = [];
                   let yArray = [];
                   Object.keys(timeseries[key]['Shape-mean']).forEach(function(key2) {
                       xArray.push(timeseries[key]['Shape-mean'][key2]);
                       yArray.push(timeseries[key]['datetime'][key2]);
                    });
                    console.log($("#type_graph_select2").val());
                    initialize_graphs(yArray,xArray,`${$("#variables_graph").val()} Mean`,`${$("#variables_graph").val()}`,"",`${$("#variables_graph").val()}`,$("#type_graph_select2").val());
                 }
                 else{
                   graphs_features(timeseries[key],request_obj['attr_name'],$("#type_graph_select2").val());
                 }
             }
             $('#GeneralLoading').addClass('hidden');
           }
           catch(e){
             console.log(e);
             $('#GeneralLoading').addClass('hidden');
             $.notify(
                 {
                   message: `There was an error while retrieving the data from the ${$("#variables_graph").val()} `
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
         error: function(e){
           console.log(e);
           $('#GeneralLoading').addClass('hidden');
           $.notify(
               {
                 message: `There was an error while retrieving the data from the ${$("#variables_graph").val()} `
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

     });
   }
   if(var_val != "select_val" && type_drawing == "sptial_in"){
     $('#GeneralLoading').addClass('hidden');

     $.notify(
         {
           message: `Please select a Spatial Input Mask to retrieve time series`
         },
         {
             type: "info",
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
   if(var_val == "select_val" && type_drawing != "sptial_in"){
     $('#GeneralLoading').addClass('hidden');

     $.notify(
         {
           message: `Please select a Thredds file to be able to see the variables associated to it`
         },
         {
             type: "info",
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





}

 var create_table = function(){

   console.log("hola");


 }
