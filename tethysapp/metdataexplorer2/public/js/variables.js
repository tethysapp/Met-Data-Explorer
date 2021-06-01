
var VARIABLES_PACKAGE = (function(){

  $(function(){
    $("#btn-add-addVariables").on("click",addVariablesToTD);

  })

})()


var addVariablesToTD = function(){
  // let $modalAddVars = $("#modalAddVariablesForm");
  // var datastring = $modalAddVars.serialize()
  // datastring += `&actual-group=${current_Group}`
  // datastring += `&actual-tdds=${current_tdds}`
  // $.ajax({
  //     type: "POST",
  //     url: `add-vars/`,
  //     data: datastring,
  //     dataType: "HTML",
  //     success: function(result) {
  //       console.log("nola");
  //
  //     },
  //     error:function(e){
  //
  //     }
  //   })
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

     // $('#loading-modal').modal('show');
     $.ajax({
         url: URL_getFullArray,
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

 var create_table = function(){

   console.log("hola");


 }
