var baseURL = "{% static 'metdataexplorer2/images/' %}"

var AUX_PACKAGE = (function () {
  /*
  ****** FU1NCTION NAME: addDefaultBehaviorToAjax *********
  ****** FUNCTION PURPOSE: make dynamic ajax requests *********
  */
  var addDefaultBehaviorToAjax = function () {
    // Add CSRF token to appropriate ajax requests
    $.ajaxSetup({
      beforeSend: function (xhr, settings) {
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
  var checkCsrfSafe = function (method) {
    // these HTTP methods do not require CSRF protection
    return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method)
  }
  /*
  ****** FU1NCTION NAME: getCookie *********
  ****** FUNCTION PURPOSE: Retrieve a cookie value from the csrf token *********
  */
  var getCookie = function (name) {
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
  var activate_deactivate_graphs = function () {

    let actual_state = $(this).prop('checked');
    // console.log(actual_state);
    let element_graphs = document.getElementById("graph");

    let element_map = document.getElementById("map");
    if (actual_state) {
      $("#graph").show();
      $("#graph").removeClass("hidden");

      if ($(window).width() > 320 && $(window).width() <= 480) {
        element_graphs.style.cssText = "display: flex; flex-direction: column;";
      } else {
        element_graphs.style.cssText = "display: flex; flex-direction: row;";
      }
      mapObj._onResize();
      try {
        if ($('#plots').is(':visible')) {
          Plotly.Plots.resize("plots");
          Plotly.relayout($("plots"), {
            'xaxis.autorange': true,
            'yaxis.autorange': true
          });
        }
      } catch (e) {
        console.log("Simple plotly error, not worry")
      }
    } else {
      $("#graph").hide();
    }

  };

  $(function () {
    addDefaultBehaviorToAjax();
    $('#sG').change(activate_deactivate_graphs);
    initialize_graphs([], [], "No data Available", "", "", "", "scatter");
    $("#btn-r-reset").on("click", reset_keywords);

  })

})()

//ADD A USER SHAPEFILE TO THE MAP
//Ajax call to send the shapefile to the client side
var uploadShapefile = function () {
  let files = $('#shapefile-upload')[0].files;
  if (files.length !== 4) {
    alert('The files you selected were rejected. Upload exactly 4 files ending in shp, shx, prj and dbf.');
    return
  }
  let data = new FormData();
  Object.keys(files).forEach(function (file) {
    data.append('files', files[file]);
  });
  console.log(data);
  console.log(files);
  $.ajax({
    url: 'upload-shapefile/',
    type: 'POST',
    data: data,
    dataType: 'json',
    processData: false,
    contentType: false,
    success: function (result) {
      try {
        // console.log(result);
        let filename = result["filename"];
        let alreadyMade = result["alreadyMade"];
        let geoJsonObject = JSON.parse(result['geojson']);
        let check = {};
        geoJsonObject['features'].forEach(function (fed) {
          Object.keys(fed['properties']).forEach(function (single_k) {
            if (!check.hasOwnProperty(single_k)) {
              check[single_k] = [];
              check[single_k].push(fed['properties'][single_k]);
            } else {
              check[single_k].push(fed['properties'][single_k]);
            }

          })
        })
        let attr_shp = [];
        Object.keys(check).forEach(function (ch_key) {
          let unique_check = check[ch_key].filter((v, i, a) => a.indexOf(v) == i)
          // if(check[ch_key].length == geoJsonObject['features'].length){
          if (unique_check.length == geoJsonObject['features'].length) {
            attr_shp.push(ch_key)
          }
        })
        console.log(geoJsonObject['features']);
        console.log(attr_shp);
        if (attr_shp.length == 0) {
          notify_user_info('Please, upload a different shapefile that contains at least a common property in all the features of the shapefile');
        }
        // else{
        input_spatial = filename
        // let attr_shp = Object.keys(geoJsonObject['features'][0]['properties']);
        let feature_select = $("#features_file");
        feature_select.empty();
        feature_select.selectpicker('refresh');

        attr_shp.forEach(function (attr) {
          let option;
          option = `<option value=${attr} >${attr} </option>`;
          feature_select.append(option)
          feature_select.selectpicker("refresh");
        });
        var myStyle = {
          "color": "#E2E5DE",
          "weight": 5,
          "opacity": 0.5
        };

        jsonLayer = L.geoJSON(geoJsonObject, {
          style: myStyle
        })
        jsonLayer.addTo(mapObj);
        mapObj.flyToBounds(jsonLayer.getBounds());

        if (alreadyMade == true) {
          console.log('You already have a shape with this name. Please rename your file and try again.');
        } else {
          $('#externalSPTL_modal').modal('hide');
        }
        // }

      } catch (e) {
        console.log(e);
        notify_user_danger('There was problem updating the shapefile');
      }
    },
    error: function (error) {
      console.log(error);
      notify_user_danger('There was problem updating the shapefile');
    }
  });
}

var reset_keywords = function () {
  try {
    $('#btn-r-reset').hide();
    $("#current-GroupThredds").find("li").each(function () {
      var $li = $(this)['0'];
      let id_li = $li['id'];

      $(`#${id_li}`).css({
        "opacity": "1",
        "border-color": "#d3d3d3",
        "border-width": "1px",
        "border-style": "solid",
        "color": "#555555",
        "font-weight": "normal"
      });


    });
  } catch (error) {
    notify_user_danger('There is a problem reseting the fitler');
  }
}

var metadata_button_modal = function (infoService) {
  let table_content = '<table id = "table_metadata_file2" class="table table-hover table-condensed"><thead><tr>'
  table_content += '<th>Property</th><th>Value</th></tr></thead><tbody>'
  // let var_metad = JSON.parse(attribute['metadata_var']);
  let mtda_objt = infoService;

  let all_file_keys = Object.keys(mtda_objt);

  for (let j = 0; j < all_file_keys.length; ++j) {
    if (all_file_keys[j] != 'attributes' && all_file_keys[j] != 'spatial') {
      table_content += `<tr><td>${all_file_keys[j]}</td><td>${mtda_objt[all_file_keys[j]]}</td></tr>`;
    }

    if (all_file_keys[j] == 'attributes') {
      table_content += `<tr><td>${all_file_keys[j]}</td><td>${Object.keys(mtda_objt[all_file_keys[j]]).length}</td></tr>`;
    }
  }
  table_content += "</tbody> </table>"
  return table_content

}

var make_metadata_file_table = function (metadata_string, layer_obj) {
  let table_content = '<table id = "table_metadata_file" class="table table-hover table-condensed"><thead><tr>'
  table_content += '<th>Property</th><th>Value</th></tr></thead><tbody>'
  // let var_metad = JSON.parse(attribute['metadata_var']);
  let mtda_objt = JSON.parse(metadata_string);

  let all_file_keys = Object.keys(mtda_objt);
  let extra_meta = get_extra_file_metdata(layer_obj);
  table_content += extra_meta;
  for (let j = 0; j < all_file_keys.length; ++j) {
    table_content += `<tr><td>${all_file_keys[j]}</td><td>${mtda_objt[all_file_keys[j]]}</td></tr>`
  }
  table_content += "</tbody> </table>"
  return table_content

}

var general_search = function (id_search_input, id_table) {
  try {
    input = document.getElementById(`${id_search_input}`);
    filter = input.value.toUpperCase();
    table = document.getElementById(`${id_table}`);

    tr = table.getElementsByTagName("tr");
    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[1];
      if (td) {
        txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
    }
  } catch (error) {
    notify_user_danger('There was a problem preforming the search');
  }
}

// for only one group
var searchGroups_group = function () {

  try {
    general_search("add-attribute", "attributes_table");
  } catch (error) {
    console.log(error);
  }
}

//for the attr in the variables filter
var searchVariables_func = function () {

  try {
    general_search("search_attr", "data-table");
  } catch (error) {
    console.log(error);
  }
}

var getVariablesAndFileMetadata = function (opendapURL) {
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
      $("#loading-folders").addClass("hidden")
    }
  })
  return [variables, fileMetadata];
}

var uuidv4 = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

var options_vars = function (attributes, new_title) {
  try {
    let variable_select = $("#variables_graph");
    variable_select.empty();
    variable_select.selectpicker("refresh");
    for (var i = 0; i < attributes.length; ++i) {

      let option = `<option value= ${attributes[i]['name']}>${attributes[i]['name']}</option>`;
      variable_select.append(option);
      variable_select.selectpicker("refresh");
    }


  } catch (e) {
    console.log(e);
  }
  // return html_vars

}

var getRandomColor = function () {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

var graphs_features = function (timeseries, yTitle, type) {
  if (type == "scatter") {
    let xArray = [];
    let yArray = [];
    let dataArray = [];
    Object.keys(timeseries).forEach(function (key2) {
      if (key2 == "datetime") {
        Object.keys(timeseries[key2]).forEach(function (key3) {
          xArray.push(timeseries[key2][key3]);
        })
      } else {
        let temp_dict = {};
        temp_dict[key2] = timeseries[key2]
        yArray.push(temp_dict);
      }
    });

    let i = 0;
    yArray.forEach(function (sinlge_attr) {
      let displayOption = i > 0 ? 'legendonly' : true
      let one_attr = [];
      let title_un;
      Object.keys(sinlge_attr).forEach(function (key3) {
        title_un = key3;
        Object.keys(sinlge_attr[key3]).forEach(function (key4) {
          one_attr.push(sinlge_attr[key3][key4]);
        })
      })
      let trace = {
        x: xArray,
        y: one_attr,
        mode: 'lines',
        type: 'scatter',
        name: title_un,
        text: [],
        marker: {size: 5},
        line: {color: getRandomColor()},
        visible: displayOption
      };
      dataArray.push(trace);
      i = i + 1;
    });

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
      autosize: true,
      showlegend: true,
      legend: {
        "orientation": "v",
        traceorder: 'reversed'

      },
      margin: {
        l: 40,
        r: 40,
        b: 40,
        t: 40,
        pad: 10
      },
    };

    var config = {
      modeBarButtonsToRemove: ['hoverClosestCartesian', 'hoverCompareCartesian', 'resetScale2d', 'toggleSpikelines'],
      displaylogo: false,
      responsive: true
    };
    Plotly.newPlot('plots', dataArray, layout, config);
  }


  if (type === "whisker") {
    let xArray = [];
    let yArray = [];
    let dataArray = [];
    Object.keys(timeseries).forEach(function (key2) {
      if (key2 != "datetime") {
        let temp_dict = {};
        temp_dict[key2] = timeseries[key2]
        yArray.push(temp_dict);
      }
    });
    let i = 0;
    yArray.forEach(function (sinlge_attr) {
      let displayOption = i > 0 ? 'legendonly' : true
      let one_attr = [];
      let title_un;
      Object.keys(sinlge_attr).forEach(function (key3) {
        title_un = key3;
        Object.keys(sinlge_attr[key3]).forEach(function (key4) {
          one_attr.push(sinlge_attr[key3][key4]);
        })
      })
      let trace = {
        x: one_attr,
        type: 'box',
        name: title_un,
        boxpoints: 'outliers',
        boxmean: 'sd',
        visible: displayOption,
      };

      dataArray.push(trace);
      i = i + 1;
    });

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
      autosize: true,
      showlegend: true,
      legend: {
        "orientation": "v",
        traceorder: 'reversed'
      },
      margin: {
        l: 40,
        r: 40,
        b: 40,
        t: 40,
        pad: 10
      },
    };

    var config = {
      modeBarButtonsToRemove: ['hoverClosestCartesian', 'hoverCompareCartesian', 'resetScale2d', 'toggleSpikelines'],
      displaylogo: false,
      responsive: true
    };

    Plotly.newPlot('plots', dataArray, layout, config);
  }

  window.onresize = function () {
    Plotly.relayout('plots', {
      'xaxis.autorange': true,
      'yaxis.autorange': true
    });
  };
}

var initialize_graphs = function (xArray, yArray, title_graph, xTitle, yTitle, legend1, type, xArrayIn, yArrayIn) {
  try {
    let element_graphs = document.getElementById("graph");
    $("#graphs").empty();
    let element_map = document.getElementById("map");
    //make the down part visible and also give the design of the model//
    if ($(window).width() > 320 && $(window).width() <= 480) {
      element_graphs.style.cssText = "display: flex; flex-direction: column;";
    } else {
      element_graphs.style.cssText = "display: flex; flex-direction: row;";
    }

    var config = {
      modeBarButtonsToRemove: ['hoverClosestCartesian', 'hoverCompareCartesian', 'resetScale2d', 'toggleSpikelines'],
      displaylogo: false,
      responsive: true
    };

    if (type === "scatter") {
      var trace1 = {
        x: xArray,
        y: yArray,
        mode: 'lines',
        type: type,
        name: legend1,
        text: [],
        marker: {size: 5},
        line: {color: '#17BECF'}
      };
      var interpolation_trace;
      var data = [];
      data.push(trace1)
      if (xArrayIn != undefined && yArrayIn != undefined) {
        interpolation_trace = {
          x: xArrayIn,
          y: yArrayIn,
          mode: 'lines',
          type: type,
          name: `Mean Interpolation`,

          text: [],
          marker: {size: 5},
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
        autosize: true,
        // showlegend:true,
        legend: {
          "orientation": "h",
          traceorder: 'reversed'

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

    if (type === "whisker") {
      let trace1 = {
        y: yArray,
        type: 'box',
        name: 'All Points',
        boxpoints: 'outliers',
        boxmean: 'sd'
      };

      let data = [trace1];

      // let layout = {
      //   title: title_graph,
      //   autosize: true,
      // };

      var layout = {
        title: title_graph,
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
        autosize: true,
        // showlegend:true,
        legend: {
          "orientation": "h",
          traceorder: 'reversed'

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
    // update the layout to expand to the available size
    // when the window is resized
    window.onresize = function () {
      Plotly.relayout('plots', {
        'xaxis.autorange': true,
        'yaxis.autorange': true
      });
    };


  } catch (e) {
    notify_user_danger('Unable to initialize the graphs');
  }
}

var html_for_servers = function (isAdmin, title, group_name, url_opendap, url_wms, url_subset, isNew) {
  try {
    let good_title = id_dictionary[title].split('_join_')[0];
    let check_var = ((isNew == true) ? 'checked' : '');
    if (isAdmin) {
      let newHtml = `
      <li class="ui-state-default" layer-name="${title}" id="${title}" data-opendap-url="${url_opendap}" data-wms-url="${url_wms}" data-subset-url="${url_subset}">

        <span  id= "${title}_span" layer-name="${title}" data-opendap-url="${url_opendap}" data-wms-url="${url_wms}" data-subset-url="${url_subset}" class="server-name tool_tip_h" data-toggle="tooltip" data-placement="right" title="${good_title}">${good_title}</span>
        
        <button id = "refresh_file" class="btn btn-default btn-xs" data-toggle="modal" data-dismiss="modal">
        <span class="glyphicon glyphicon-refresh"></span>
        </button>
        <button id = "edit_file" class="btn btn-default btn-xs" data-toggle="modal" data-dismiss="modal" data-target="#modalEditServices">
          <span class="glyphicon glyphicon-cog"></span>
        </button>
        <button id= "add_var" class="btn btn-default btn-xs" data-toggle="modal" data-dismiss="modal" data-target="#modalAddVariables">
          <span class="glyphicon glyphicon-plus"></span>
        </button>
        <button id="delete-var" class="btn btn-default btn-xs" data-toggle="modal"  data-dismiss="modal" data-target="#modalDeleteVariable">
          <span class="glyphicon glyphicon-trash"></span>
        </button>

      </li>
      `;
      return newHtml

    } else {
      let newHtml = `
      <li class="ui-state-default" layer-name="${title}" id="${title}" data-opendap-url="${url_opendap}" data-wms-url="${url_wms}" data-subset-url="${url_subset}">
        <span  id= "${title}_span" layer-name="${title}" data-opendap-url="${url_opendap}" data-wms-url="${url_wms}" data-subset-url="${url_subset}" class="server-name tool_tip_h" data-toggle="tooltip" data-placement="right" title="${good_title}">${good_title}</span>
        <button id = "edit_file" class="btn btn-default btn-xs" data-toggle="modal" data-dismiss="modal" data-target="#modalEditServices">
          <span class="glyphicon glyphicon-cog"></span>
        </button>

      </li>
      `;
      return newHtml
    }
  } catch (e) {
    console.log(e);
  }
}

var html_for_groups = function (isAdmin, title, id_group_separator) {
  try {
    let newHtml;
    if (isAdmin) {
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
    } else {
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
  } catch (e) {
    console.log(e);
  }
}

var check_for_same_names = function (type_level, title_to_check) {
  let check_nene = false;
  if (type_level == "Group") {
    $(".group-name").each(function () {
      if ($(this).html().trim() == title_to_check) {
        check_nene = true;
      }
    })
  }
  if (type_level == "Thredds") {
    add_services_list.forEach(function (single_serv) {
      if (single_serv['title'] == title_to_check) {
        check_nene = true;
      }
    })
  }
  return check_nene;
}

var addAttribute = function (attribute, dimensionString) { //, units, color) {
  let options = '';
  //let dimOptions;
  let html = ''
  let count = $('.attr-checkbox').length;
  let class_name_ = "";
  let isChecked = "checked";
  if (isAdding == false) {
    class_name_ = (current_vars.includes(attribute)) ? class_name_ = "success" : class_name_ = "";
    isChecked = "";
  }

  if (dimensionString == false) {
    html += `<tr class="${class_name_}">
                    <td>
                      <input type="checkbox" class="attr-checkbox" value="${attribute}_a_${count}" ${isChecked}  name="variable">
                    </td>
                    <td class = "attrbute_name">
                      <label >${attribute}</label>
                    </td>
                    <td>
                      <div class = "vertical_buttons">
                      <div>
                        <span class ="glyphicon glyphicon-sort-by-attributes"></span>: <input id = "${attribute}_time" class="tables_mul">
                      </div>
                      <div>
                        <span class = "glyphicon glyphicon-map-marker"></span>: <input id = "${attribute}_location" class="tables_mul">
                      </div>
                      </div>

                    </td>
                  </tr>`
  } else {
    let dimensionList = dimensionString.split(',');
    for (let i = 0; i < dimensionList.length; i++) {
      options += `<option>${dimensionList[i]}</option>`;
    }
    html += `<tr class="${class_name_}">
                    <td >
                      <input type="checkbox" class="attr-checkbox" ${isChecked} value="${attribute}_a_${count}"  name="variable">
                    </td>
                    <td class = "attrbute_name">
                      <label>${attribute}</label>
                    </td>
                    <td>
                      <select id = "${attribute}_time" class="selectpicker tables_mul" data-live-search="false" data-width="100%" data-style="btn-primary" multiple>${options}</select>
                    </td>
                  </tr>`
  }
  return html;
}

var get_metadata_button = function (attribute) {
  let table_content = '<table id = "table_metadata" class="table table-hover table-responsive table-sm"><thead><tr>'
  table_content += '<th>Property</th><th>Value</th></tr></thead><tbody>'
  let var_metad = attribute;
  let all_vars_keys = Object.keys(attribute);

  for (let j = 0; j < all_vars_keys.length; ++j) {
    if (all_vars_keys[j] != 'metadata_var') {
      table_content += `<tr><td>${all_vars_keys[j]}</td><td>${var_metad[all_vars_keys[j]]}</td></tr>`
    } else {
      let new_small_met = JSON.parse(var_metad[all_vars_keys[j]]);
      let keys_new_met = Object.keys(new_small_met);
      for (let k = 0; k < keys_new_met.length; ++k) {
        table_content += `<tr><td>${keys_new_met[k]}</td><td>${new_small_met[keys_new_met[k]]}</td></tr>`
      }
    }
  }
  table_content += "</tbody> </table>"
  return table_content
}

var get_extra_file_metdata = function (layer_obj) {

  let table_content = `<tr><td>Name</td><td>${layer_obj["title"]}</td></tr>`
  table_content += `<tr><td>Description</td><td>${layer_obj["description"]}</td></tr>`
  table_content += `<tr><td>OPENDAP Enpoint</td><td>${layer_obj["url"]}</td></tr>`
  table_content += `<tr><td>WMS Endpoint</td><td>${layer_obj["url_wms"]}</td></tr>`
  table_content += `<tr><td>Subset Endpoint</td><td>${layer_obj["url_subset"]}</td></tr>`
  return table_content
}
