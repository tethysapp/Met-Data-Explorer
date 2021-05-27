
var baseURL = "{% static 'metdataexplorer2/images/' %}"

var AUX_PACKAGE = (function(){
    /*
    ****** FU1NCTION NAME: addDefaultBehaviorToAjax *********
    ****** FUNCTION PURPOSE: make dynamic ajax requests *********
    */
    var addDefaultBehaviorToAjax = function() {
        // Add CSRF token to appropriate ajax requests
        $.ajaxSetup({
            beforeSend: function(xhr, settings) {
                if (!checkCsrfSafe(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"))
                }
            }
        })
    }
    /*
    ****** FU1NCTION NAME: checkCsrfSafe *********
    ****** FUNCTION PURPOSE: CHECK THE OPERATIONS THAT DOES NOT NEED A CSRF VERIFICATION *********
    */
    var checkCsrfSafe = function(method) {
        // these HTTP methods do not require CSRF protection
        return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method)
    }
    /*
    ****** FU1NCTION NAME: getCookie *********
    ****** FUNCTION PURPOSE: Retrieve a cookie value from the csrf token *********
    */
    var getCookie = function(name) {
        var cookie
        var cookies
        var cookieValue = null
        var i
        if (document.cookie && document.cookie !== "") {
            cookies = document.cookie.split(";")
            for (i = 0; i < cookies.length; i += 1) {
                cookie = $.trim(cookies[i])
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === name + "=") {
                    cookieValue = decodeURIComponent(
                        cookie.substring(name.length + 1)
                    )
                    break
                }
            }
        }
        return cookieValue
    }

    /*
    ************ FUNCTION NAME: ACTIVATE_DEACTIVATE_GRAPHS **********************
    ************ PURPOSE: THE FUNCTIONS SHOWS THE GRAPHS IN THE LOWER PORTION OF THE MAP ***********
    */
    var activate_deactivate_graphs = function(){

      let actual_state=$(this).prop('checked');
      let element_graphs=document.getElementById("graph");

      let element_map =document.getElementById("map");
      if(actual_state){
        if($( window ).width() > 320 && $( window ).width() <= 480){
          element_graphs.style.cssText=  "display: flex !important; flex-direction: column;";
        }
        else{
          element_graphs.style.cssText=  "display: flex !important; flex-direction: row;";
        }

        try{
          if($('#plots').is(':visible')){
            Plotly.Plots.resize("plots");
              Plotly.relayout($("plots"), {
                'xaxis.autorange': true,
                'yaxis.autorange': true
              });
          }
        }
        catch(e){
          console.log("Simple plotly error, not worry")
        }
      }

      else{
        $("#graph").hide();
      }

    };

    $(function(){
      addDefaultBehaviorToAjax();
      $('#sG').change(activate_deactivate_graphs);
      initialize_graphs([],[],"No data Available","","","","scatter");

    })

})()

var getVariablesAndFileMetadata = function (opendapURL) {
    //$("#loading-modal").modal("show");
    console.log("getVariablesAndFileMetadata");
    let variables = {};
    let fileMetadata = '';
    $.ajax({
        url: "getVariablesAndFileMetadata/",
        data: {opendapURL: opendapURL},
        dataType: "json",
        contentType: "application/json",
        method: "GET",
        async: false,
        success: function (result) {
            variables = result["variables_sorted"];
            fileMetadata = result["file_metadata"];
        }
    })
    return [variables, fileMetadata];
}
var uuidv4 = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
var options_vars = function(attributes, new_title){
  try{
    let variable_select = $("#variables_graph");
    variable_select.empty();
    variable_select.selectpicker("refresh");
    for(var i= 0;  i< attributes.length; ++i){

      let option = `<option value= ${attributes[i]['name']}_${new_title} >${attributes[i]['name']}</option>`;
      variable_select.append(option);
      variable_select.selectpicker("refresh");
    }


  }
  catch(e){
    console.log(e);
  }
  // return html_vars

}
var initialize_graphs = function(xArray,yArray,title_graph,xTitle,yTitle,legend1,type,xArrayIn,yArrayIn){
  try{
    let element_graphs=document.getElementById("graph");
    $("#graphs").empty();
    let element_map =document.getElementById("map");
      //make the down part visible and also give the design of the model//



    if($( window ).width() > 320 && $( window ).width() <= 480){
      element_graphs.style.cssText=  "display: flex; flex-direction: column;";
    }
    else{
      element_graphs.style.cssText=  "display: flex !important; flex-direction: row;";
    }





    var config = {
       modeBarButtonsToRemove: ['hoverClosestCartesian', 'hoverCompareCartesian','resetScale2d','toggleSpikelines'],
       displaylogo: false,
       responsive:true
    };

    if(type === "scatter"){
      var trace1 = {
        x: xArray,
        y: yArray,
        mode: 'lines',
        type: type,
        name: legend1,
        text: [],
        marker: { size: 5 },
        line: {color: '#17BECF'}
      };
      var interpolation_trace;
      var data = [];
      data.push(trace1)
      if(xArrayIn != undefined && yArrayIn != undefined){
        interpolation_trace = {
          x: xArrayIn,
          y: yArrayIn,
          mode: 'lines',
          type: type,
          name: `Mean Interpolation`,

          text: [],
          marker: { size: 5 },
          line: {
            color: '#FF6347',
            dash: 'dot',
          }
        };
        data.push(interpolation_trace);
      }

      var layout = {
        width: $(".carousel-inner").parent().width(),
        yaxis: {
          title: {
           text: yTitle,
           font: {
             size: 15,
             color: '#7f7f7f'
           }
         },
         automargin: true,
        },
        xaxis: {
         automargin: true,
        },
        // title: title_graph,
        autosize: true,
        showlegend:true,
        legend: {
          "orientation": "h",
          yanchor: 'top',
          xanchor:'center',
          y:-0.15,
          x:0.5
        },
        margin: {
          l: 40,
          r: 40,
          b: 40,
          t: 40,
          pad: 10
        },
      };


      Plotly.newPlot('plots', data, layout, config);

    }

    if(type === "whisker"){
      let trace1 = {
        y: yArray,
        type: 'box',
        name: 'All Points',
        marker: {color: '#3D9970'},
        boxpoints: 'outliers',
        boxmean: 'sd'

      };

      let data = [trace1];

      let layout = {
        title: title_graph,
        autosize: true,

      };
      Plotly.newPlot('plots', data, layout, config);
    }
    // update the layout to expand to the available size
    // when the window is resized
    window.onresize = function() {
        Plotly.relayout('plots', {
            'xaxis.autorange': true,
            'yaxis.autorange': true
        });
    };


  }
  catch(e){
    $.notify(
        {
            message: `Unable to initialize the graphs`
        },
        {
            type: "danger",
            allow_dismiss: true,
            z_index: 20000,
            delay: 5000
        }
    )
  }

}
var html_for_servers = function (title,group_name, url_opendap, url_wms, url_subset,isNew){
  console.log(url_subset);
  try{
    let good_title = id_dictionary[title].split('_join_')[0];

//     let html_vars = '';
//     for(var i= 0;  i< variables_array.length; ++i){
//       html_vars +=
// `      <li class="ui-state-default buttonAppearance" id="${variables_array[i]['name']}_${title}" variable-layer="${variables_array[i]['name']}_${title}">
//           <span class="variable-name tool_tip_h" data-toggle="tooltip" data-placement="right" title="${variables_array[i]['name']}">${variables_array[i]['name']}</span>
//           <input id = "${variables_array[i]['name']}_${title}_check" class="chkbx-variables" type="checkbox" data-color= "${variables_array[i]['colors']}" value = "${variables_array[i]['name']}">
//           <button class="btn btn-primary btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalStyleInfo">
//             <i class="fas fa-layer-group"></i>
//           </button>
//           <button class="btn btn-primary btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalVariableInfo">
//             <span class=" glyphicon glyphicon-info-sign "></span>
//           </button>
//           <button id = "${variables_array[i]['name']}_${title}_plots"" class="btn btn-primary btn-sm">
//             <i class="fas fa-chart-bar"></i>
//           </button>
//       </li>`
//     }
    let check_var = (( isNew == true ) ? 'checked' : '');
    let newHtml = `
    <li class="ui-state-default" layer-name="${title}" id="${title}" data-opendap-url="${url_opendap}" data-wms-url="${url_wms}" data-subset-url="${url_subset}">
      <span class="server-name tool_tip_h" data-toggle="tooltip" data-placement="right" title="${good_title}">${good_title}</span>
      <input id = "${title}_check" data-opendap-url="${url_opendap}" data-wms-url="${url_wms}" data-subset-url="${url_subset}"  class="chkbx-layer" type="checkbox" data-toggle="tooltip" data-placement="bottom" title="Show/Hide View" >

      <button id= "add_var" class="btn btn-default btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalAddVariables">
        <span class="glyphicon glyphicon-plus"></span>
      </button>
      <button id="delete-var" class="btn btn-default btn-sm" data-toggle="modal"  data-dismiss="modal" data-target="#modalDelete">
        <span class="glyphicon glyphicon-trash"></span>
      </button>

      <button type="button" id="${title}_${group_name}_reload" class="btn btn-default btn-sm" >
       <span  class="glyphicon glyphicon-refresh tool_tip_h" aria-hidden="true" data-toggle="tooltip" data-placement="bottom" title="Update View">
       </span>
      </button>

    </li>
    `;



//     let newHtml = `<div class="panel-group" id="accordion_${title}" role="tablist" aria-multiselectable="true">
//   <div class="panel panel-default">
//     <div class="panel-heading" role="tab" id="${title}_Heading">
//       <h4 class="panel-title">
//           <li class="ui-state-default" layer-name="${title}" id="${title}" >
//           <a role="button" data-toggle="collapse" data-parent="#accordion_${title}" href="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
//
//             <span id="${title}_span" data-opendap-url="${url_opendap}" data-wms-url="${url_wms}" data-subset-url="${url_subset}" class="server-name tool_tip_h" data-toggle="tooltip" data-placement="right" title="${id_dictionary[title]}">${id_dictionary[title]}</span>
//             </a>
//
//             <input id = "${title}_check" data-opendap-url="${url_opendap}" data-wms-url="${url_wms}" data-subset-url="${url_subset}"  class="chkbx-layer" type="checkbox" data-toggle="tooltip" data-placement="bottom" title="Show/Hide View" >
//
//             <button type="button" id="${title}_zoom" class="btn btn-dark btn-sm" >
//              <span class="glyphicon glyphicon-map-marker tool_tip_h" aria-hidden="true" data-toggle="tooltip" data-placement="bottom" title="Zoom to View"></span>
//             </button>
//
//             <button id="${title}_variables" class="btn btn-dark btn-sm" data-toggle="modal" data-target="#modalShowVariablesTable"> <span class=" glyphicon glyphicon-list-alt tool_tip_h" data-toggle="tooltip" data-placement="bottom" title="View Variables"></span>
//             </button>
//
//             <button type="button" id="${title}_variables_info" class="btn btn-dark btn-sm" data-toggle="modal" data-target="#modalThreddsInformation">
//              <span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>
//             </button>
//           </li>
//       </h4>
//     </div>
//     <div id="collapseOne" class="panel-collapse collapse in" role="tabpanel" aria-labelledby="{title}_Heading">
//       <div class="panel-body">
//         ${html_vars}
//       </div>
//     </div>
//   </div>
// </div>`


    return newHtml
  }
  catch (e){
    console.log(e);
  }

}

var html_for_groups = function (isAdmin, title, id_group_separator){
  try{
    let newHtml;
    if (isAdmin){
      newHtml =

      `
      <div class="panel panel-default" id="${title}_panel">
        <div class="panel-heading buttonAppearance" role="tab" id="heading_${title}">
          <h4 class="panel-title tool_tip_h" data-toggle="tooltip" data-placement="right" title="${id_dictionary[title]}">
            <a role="button" data-toggle="collapse" data-target="#collapse_${title}" href="#collapse_${title}" aria-expanded="true" aria-controls="collapse_${title}">
            <span class="group-name"> ${id_dictionary[title]}</span>

            </a>
          </h4>
          <li class="ui-state-default buttonAppearance" id="${title}" layer-name="none">

              <input class="chkbx-layers" type="checkbox">
              <button class="btn btn-primary btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalInterface">
                <span class=" glyphicon glyphicon-info-sign "></span>
              </button>

              <button id= "add_service" class="btn btn-primary btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalAddServices">
                <span class="glyphicon glyphicon-plus"></span>
              </button>
              <button id="delete-server" class="btn btn-primary btn-sm" data-toggle="modal"  data-dismiss="modal" data-target="#modalDelete">
                <span class="glyphicon glyphicon-trash"></span>
              </button>
          </li>

        </div>

        <div id="collapse_${title}" class="panel-collapse collapse in" role="tabpanel" aria-labelledby="heading_${title}">
        <div class="iconhydro"><img src="https://img.icons8.com/dusk/24/000000/ssd.png"/>THREDDS Files</div>
          <div class="panel-body">
              <div id= ${id_group_separator} class="divForServers">
                <button class="btn btn-danger btn-block" id = "${title}-noGroups"> The group is empty</button>
              </div>
          </div>
        </div>
      </div>
      `

      return newHtml
    }
    else{
      newHtml =
      `
      <div class="panel panel-default" id="${title}_panel">
        <div class="panel-heading buttonAppearance" role="tab" id="heading_${title}">
          <h4 class="panel-title tool_tip_h" data-toggle="tooltip" data-placement="right" title="${id_dictionary[title]}">
            <a role="button" data-toggle="collapse" data-parent="#current-Groupservers" href="#collapse_${title}" aria-expanded="true" aria-controls="collapse_${title}">
            <span class="group-name">${id_dictionary[title]}</span>

            </a>
          </h4>
          <li class="ui-state-default buttonAppearance" id="${title}" layer-name="none">
            <input class="chkbx-layers" type="checkbox">
            <button class="btn btn-primary btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalInterface">
              <span class=" glyphicon glyphicon-info-sign "></span>
            </button>
          </li>
        </div>
        <div id="collapse_${title}" class="panel-collapse collapse in" role="tabpanel" aria-labelledby="heading_${title}">
          <div class="panel-body">
              <div id= ${id_group_separator} class="divForServers"></div>
          </div>
        </div>
      </div>
      `

      return newHtml
    }
  }
  catch(e){
    console.log(e);
  }
}
var check_for_same_names = function(type_level, title_to_check){
  let check_nene = false;
  if(type_level == "Group"){
    console.log("in process");
    $(".group-name").each(function(){
      if($(this).html().trim() == title_to_check){
        check_nene = true;
      }
    })
  }
  if(type_level == "Thredds"){
    add_services_list.forEach(function(single_serv){
      if(single_serv['title'] == title_to_check){
        check_nene = true;
      }
    })
  }
  return check_nene;
}

// var check_if_td_contained = function(td_name,tds_array){
//   let checked = false;
//   tds_array.forEach(function(single_tds){
//     if(td_name == single_tds['title']){
//        checked = true;
//     }
//   })
//   return checked;
// }
//
// var check_tdds_groups = function(group_name){
//   // make ajax request to know the tdds //
//   let group_name_obj={
//     group: group_name
//   };
//   $.ajax({
//       type: "GET",
//       url: `load-group/`,
//       dataType: "JSON",
//       data: group_name_obj,
//       success: result => {
//         console.log(result);
//         return result;
//
//
//       },
//       error:function(e){
//         console.log(e);
//         let no_data = {}
//         return no_data
//       }
//     })
// }
