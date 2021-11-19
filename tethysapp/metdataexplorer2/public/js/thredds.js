var THREDDS_PACKAGE = (function () {

  $(function () {
    $("#btn-add-addService2").on("click", addSingleThreddsServer);
    $(document).on("click", '#delete-server', get_tdds_list_for_group);
    $("#btn-del-server").on("click", delete_single_tdds);
    //ADDITION SERVICE //
    $(document).on("click", "#add_service", function () {
      $("#btn-add-addServiceToTable").hide();
      $("#btn-add-addService2").removeClass("hidden");
    });

    $(document).on("click", "#add_var", display_vars_from_OpenDabs);
    $(document).on("click", "#delete-var", display_vars_from_Tdds);
    document.getElementById('add-attribute2').addEventListener("keyup", searchGroups_group);
    $('#select-all-button2').click(function () {
      if ($('#select-all-button2').attr('data-select') === 'true') {
        $('#select-all-button2').empty();
        $('#select-all-button2').html(`<span class="glyphicon glyphicon-check"></span>`);
        $('#select-all-button2').attr('data-select', 'false');
        $('.attr-checkbox').each(function () {
          $(this).prop('checked', false);
        });
      } else {
        $('#select-all-button2').empty();
        $('#select-all-button2').html(`<span class="glyphicon glyphicon-unchecked"></span>`);
        $('#select-all-button2').attr('data-select', 'true');
        $('.attr-checkbox').each(function () {
          $(this).prop('checked', true);
        });
      }
    });

    $('#btn-edit-service').on("click", edit_single_tdds)
    $(document).on("click", "#edit_file", function () {
      console.log(current_tdds);
      console.log(current_Group);
      let request_obj = {
        group: current_Group,
        tds: current_tdds
      }
      $.ajax({
        type: "GET",
        url: `get-edit_info/`,
        dataType: "JSON",
        data: request_obj,
        success: function (result) {
          $("#editService-title").val(result['title']);
          $("#editService-description").val(result['description']);
          $("#epsg-input2").val(result['epsg']);
        }
      })
    })
    $(document).on("click", "#refresh_file", function () {
      console.log(current_tdds);
      console.log(current_Group);
      let request_obj = {
        group: current_Group,
        tds: current_tdds
      }
      $.ajax({
        type: "GET",
        url: `refresh_file/`,
        dataType: "JSON",
        data: request_obj,
        success: function (result) {
          //$("#editService-title").val(result['title']);
          //$("#editService-description").val(result['description']);
          //$("#epsg-input2").val(result['epsg']);
        }
      })
    })
  })

})()

var display_vars_from_Tdds = function () {
  try {
    // make ajax request to know the tdds //
    let request_obj = {
      group: current_Group,
      tdds: current_tdds
    };

    $.ajax({
      type: "POST",
      url: `get-vars/`,
      dataType: "JSON",
      data: request_obj,
      success: function (result) {
        try {
          $modalDelete = $("#modalDeleteVariable");
          //Dynamically generate the list of existing hydroservers'
          var tdds_list = result["var_list"]
          var HSTableHtml =
              '<table class="table table-condensed-xs" id="tbl-tdds"><thead><th>Select</th><th>Variable</th></thead><tbody>'
          if (tdds_list.length === 0) {
            $modalDelete
                .find(".modal-body")
                .html(
                    "<b>There are no Variables in the Thredds file.</b>"
                )
          } else {
            for (var i = 0; i < tdds_list.length; i++) {
              var title = tdds_list[i].name

              HSTableHtml +=
                  `<tr id="${title}deleteID">` +
                  '<td><input class = "check_hs_delete" type="checkbox" name="variables_del" value="' +
                  title +
                  '"></td>' +
                  '<td class="var_title">' +
                  title +
                  "</td>" +
                  "</tr>"
            }
            HSTableHtml += "</tbody></table>"
            $modalDelete.find(".modal-body").html(HSTableHtml)
          }
        } catch (e) {
          console.log(e);
          notify_user_danger('An error occurred while retrieving the list of variables in the current THREDDS file');
        }
      },
      error: function (error) {
        console.log(error);
        notify_user_danger('We are having an error trying to get the list of variables in the current Thredds file');
      }
    })
  } catch (error) {
    console.log(error);
    notify_user_danger('We are having an error trying to recognize the actual Thedds file');
  }
};

var display_vars_from_OpenDabs = function () {
  $('#attributes2').empty();
  $('#warning_msg').empty();

  isAdding = false;
  //let html = '';
  let html2 = '';
  let variables = {};
  let variablesAndFileMetadata = getVariablesAndFileMetadata(opendapURL);
  let variables_list = variablesAndFileMetadata[0];
  let keys = Object.keys(variables_list);
  keys.sort();

  for (let i = 0; i < keys.length; i++) {
    let str_dims = "";
    variables_list[keys[i]]['dimensions'].forEach(function (indiv) {
      str_dims += `${indiv},`
    })
    try {
      str_dims = str_dims.slice(0, str_dims.length - 1);
    } catch (e) {
      str_dims = "";
    }

    variables[keys[i]] = str_dims;
  }
  for (let variable in variables) {
    let dimensionString = variables[variable];
    if (!current_vars.includes(variable)) {
      html2 += addAttribute(variable, dimensionString, '', '');
    }
  }
  //check if html2?
  if (html2 == '') {
    $(`#table_wrapper2`).hide();
    html2 += `<p> The thredds file does not have variables to add.</p>`;
    $('#warning_msg').removeClass("hidden");
    $(html2).appendTo('#warning_msg');

  } else {
    $('#warning_msg').addClass("hidden");
    $(`#table_wrapper2`).show();
    $(html2).appendTo('#attributes2');
  }

  $(".tables_mul").selectpicker("selectAll");
  $(".tables_mul").selectpicker("refresh");

  $("#groups_variables_div2").show();

};

var load_individual_thredds_for_group = function (group_name) {
  let group_name_obj = {
    group: group_name
  };
  $("#GeneralLoading").removeClass("hidden");
  $.ajax({
    type: "GET",
    url: `load-group/`,
    dataType: "JSON",
    data: group_name_obj,
    success: result => {
      console.log(result);
      try {
        let servers = result["thredds"]
        //USE A FUNCTION TO FIND THE LI ASSOCIATED WITH THAT GROUP  AND DELETE IT FROM THE MAP AND MAKE ALL
        // THE CHECKBOXES VISIBLE //
        let group_name_e3;
        Object.keys(id_dictionary).forEach(function (key) {
          if (id_dictionary[key] == group_name) {
            group_name_e3 = key;
          }
        });
        let id_group_separator = `${group_name_e3}_list_separator`;

        if (servers.length <= 0) {
          $(`#${group_name_e3}-noGroups`).show();
        } else {
          $(`#${group_name_e3}-noGroups`).hide();
        }

        servers.forEach(function (server) {
          let {
            title,
            url,
            url_wms,
            url_subset,
            epsg,
            //spatial,
            //description,
            //timestamp,
            attributes,
            metadata_file,
            extra_coordinate
          } = server
          let unique_id_tds = uuidv4();
          id_dictionary[unique_id_tds] = `${title}_join_${group_name}`
          let layers_style = {}
          let new_title = unique_id_tds;

          let newHtml = html_for_servers(can_delete_groups, new_title, group_name_e3, url, url_wms, url_subset);
          $(newHtml).appendTo(`#${id_group_separator}`);

          // UPDATE THE DICT VAR //
          let array_var_ = []
          attributes.forEach(function (att_single) {
            array_var_.push(att_single['name']);
          })
          dict_file_vars[new_title] = array_var_;

          //EVENTS BUTTONS//
          $(`#${new_title}`).on("click", function () {
            current_tdds = id_dictionary[new_title].split('_join_')[0];
            current_vars = dict_file_vars[new_title];
            opendapURL = $(this).attr("data-opendap-url");
            wmsURL = $(this).attr("data-wms-url");
            subsetURL = $(this).attr("data-subset-url");
          });
          // let input_check_serv = $(`#${new_title}_check`);
          // input_check_serv.on("click", function(){
          $(`#${new_title}_span`).on("click", function () {
            $('#sG').bootstrapToggle('on');

            current_tdds = id_dictionary[new_title].split('_join_')[0];
            current_Group = group_name;

            // current_vars = dict_file_vars[new_title];
            // opendapURL = $(this).attr("data-opendap-url");
            // wmsURL = $(this).attr("data-wms-url");
            subsetURL = $(this).attr("data-subset-url");
            $("#GeneralLoading").removeClass("hidden");
            $(`#${new_title}`).css({"border-color": "#2e6da4", "border-width": "2px 2px"});
            console.log(new_title);
            $(`#${last_selected_id}`).css({"border-color": "darkgrey", "border-width": "0px 0px"});
            console.log(last_selected_id);
            tdds_displaying_metadata = new_title;

            //ONLY ONE CHECKBOX AT A TIME//
            // $('input[type="checkbox"]').not(this).prop('checked', false);

            //CLEAN TABLE //
            $("#table_div").empty();
            $("#siteDes").empty();

            //MAKE DROPDOWN MENU FOR VARIABLES//
            options_vars(attributes, new_title);
            ///MAKE TABLE//
            let table_content = get_table_vars(attributes, new_title);

            let info_file = make_metadata_file_table(metadata_file, server);
            $(info_file).appendTo("#siteDes");

            $(table_content).appendTo("#table_div");
            //make the layers to display

            let layernameUI2 = `${attributes[0]['name']}_${new_title}`
            layers_style[layernameUI2] = {}
            layers_style[layernameUI2]['title'] = attributes[0]['name'];
            layers_style[layernameUI2]['opacity'] = $("#opacity-slider").val();
            layers_style[layernameUI2]['wmsURL'] = url_wms;
            layers_style[layernameUI2]['style'] = $('#wmslayer-style').val();
            layers_style[layernameUI2]['range'] = $('#wmslayer-bounds').val();
            layers_style[layernameUI2]['variable'] = attributes[0]['name'];
            layers_style[layernameUI2]['subset'] = url_subset;
            layers_style[layernameUI2]['opendap'] = url;
            layers_style[layernameUI2]['spatial'] = {};
            layers_style[layernameUI2]['epsg'] = epsg;
            layers_style[layernameUI2]['selected'] = false;
            layers_style[layernameUI2]['dimensions'] = attributes[0]['dimensions'];
            layers_style[layernameUI2]['extra_dim'] = JSON.parse(extra_coordinate);
            layers_dict_wms = layers_style;

            // make the dims dropdown for the first varriable //
            let dim_orders_id = $("#dim_select");
            dim_orders_id.empty();

            layers_style[layernameUI2]['dimensions'].forEach(function (dim) {
              let option;
              option = `<option value=${dim} >${dim} </option>`;
              dim_orders_id.append(option);
              dim_orders_id.selectpicker("refresh");
            })
            dim_orders_id.selectpicker('selectAll');

            // extra dim //
            let extra_dim_order = $("#extra_dim");

            if (layers_style[layernameUI2]['dimensions'].length > 3) {
              console.log("entro 4");
              extra_dim_order.empty();
              extra_dim_order.selectpicker("refresh");
              extra_dim_order.selectpicker('hide');
              let extra_json = layers_style[layernameUI2]['extra_dim'];
              console.log('Here is the first forEach:');
              console.log(layers_style[layernameUI2]);
              console.log(extra_json);
              //ToDo fix when extra_json[dim] is empty
              layers_style[layernameUI2]['dimensions'].forEach(function (dim) {
                if (dim != "lat" && dim != "lon") {
                  if (!dim.includes("time")) {
                    console.log("las tiene");
                    let option;
                    option = `<option value=${dim}> Select a ${dim} val </option>`;
                    extra_dim_order.append(option);
                    console.log('First One stops here:')
                    console.log(extra_json[dim]);
                    extra_json[dim].forEach(function (val_e) {
                      // console.log(val_e);
                      let option2 = `<option value=${val_e}> ${val_e} </option>`;
                      extra_dim_order.append(option2);
                    })
                    extra_dim_order.selectpicker("refresh");
                    extra_dim_order.selectpicker('show');

                  }
                }
              })
            } else {
              extra_dim_order.empty();
              extra_dim_order.selectpicker("refresh");
              extra_dim_order.selectpicker('hide');
            }

            $('#show_wms').bootstrapToggle('on');

            updateWMSLayer2(layernameUI2, layers_style[layernameUI2])
            // ADD A EVENT LISTENER FOR THE OPCACITY IN THE LAYERS SETTINGS //
            $("#opacity-slider").on("change", function () {
              changeOpacity(layernameUI2, this.value);
              layers_style[layernameUI2]['opacity'] = $("#opacity-slider").val();
            });

            // MAKE THE BUTTON MODAL FOR THE INFORMATION OF THE FILE
            for (let i = 0; i < attributes.length; ++i) {
              $(`#${attributes[i]['name']}_${new_title}_info`).on("click", function () {
                $("#metadata_vars").empty();
                let info_content = get_metadata_button(attributes[i]);
                $(info_content).appendTo("#metadata_vars");
              })

              // DEFINE THE LAYER ATTRIBUTES //

              let layernameUI = `${attributes[i]['name']}_${new_title}`
              layers_style[layernameUI] = {}
              layers_style[layernameUI]['title'] = attributes[i]['name'];
              layers_style[layernameUI]['opacity'] = $("#opacity-slider").val();
              layers_style[layernameUI]['wmsURL'] = url_wms;
              layers_style[layernameUI]['style'] = $('#wmslayer-style').val();
              layers_style[layernameUI]['range'] = $('#wmslayer-bounds').val();
              layers_style[layernameUI]['variable'] = attributes[i]['name'];
              layers_style[layernameUI]['subset'] = url_subset;
              layers_style[layernameUI]['opendap'] = url;
              layers_style[layernameUI]['spatial'] = {};
              layers_style[layernameUI]['epsg'] = epsg;
              layers_style[layernameUI]['selected'] = false;
              layers_style[layernameUI]['dimensions'] = attributes[i]['dimensions'];
              layers_style[layernameUI]['extra_dim'] = JSON.parse(extra_coordinate);

              layers_dict_wms = layers_style;

              //ADD A EVENT LISTENER FOR THE OPCACITY IN THE LAYERS SETTINGS //
              $("#opacity-slider").on("change", function () {
                changeOpacity(layernameUI, this.value);
                layers_style[layernameUI]['opacity'] = $("#opacity-slider").val();
              });


            }

            $("#GeneralLoading").addClass("hidden");
            last_selected_id = new_title;
          });

        })
        $("#GeneralLoading").addClass("hidden");
      } catch (e) {
        console.log(e);
        $("#GeneralLoading").addClass("hidden");
        notify_user_danger(`Something went wrong loading ${group_name}.`);
      }
    },
    error: function (error) {
      console.log(error);
      $("#GeneralLoading").addClass("hidden");
      notify_user_danger(`Something went wrong loading ${group_name}.`);
    }
  })
};

var get_table_vars = function (attributes, title) {
  let table_content = '<table id = "table_vars" class="table table-hover table-condensed"><thead><tr>'
  let var_metad = attributes[0];
  // MAKE THE HEADERS FIRST //
  Object.keys(var_metad).forEach(function (key) {
    if (key == "name") {
      table_content += `<th >${key}</th>`;
      table_content += `<th > Metadata</th>`;
    }
    if (key != "metadata_var" && key != "color" && key != "name" && key != "units") {
      table_content += `<th>${key}</th>`;
    }
  });

  // CLOSE HEADER //
  table_content += "</tr></thead>"
  // ADD ROWS //
  table_content += `<tbody id= "table_var_body">`
  for (let i = 0; i < attributes.length; ++i) {
    table_content += "<tr>";
    let var_metad = attributes[i];
    // MAKE THE HEADERS FIRST //
    Object.keys(var_metad).forEach(function (key) {
      if (key == "name") {
        let fixed_name = var_metad[key].replace(/_/g, ' ')
        table_content += `<td >${fixed_name}</td>`;
        table_content += `<td>
                    <button id = "${var_metad[key]}_${title}_info" class="btn btn-primary" data-toggle="modal" data-dismiss="modal" data-target="#modalMetaDataInfo">
                        <i class="fas fa-info-circle"></i>
                    </button>
          </td>`;
      }
      if (key != "metadata_var" && key != "color" && key != "name" && key != "units") {
        table_content += `<td>${var_metad[key]}</td>`;
      }
    });
    table_content += "</tr>";
  }
  table_content += "</tbody> </table>"
  return table_content
}

var addSingleThreddsServer = function () {

  try {

    //CHECKS IF THE INPUT IS EMPTY ///
    if ($("#addService-title").val() == "") {
      notify_user_danger("Please enter a title. This field cannot be blank.");
      return false
    }

    if ($("#addService-title").val() != "") {
      var regex = new RegExp("^(?![0-9]*$)[a-zA-Z0-9]+$")
      var specials = /[*|\":<>[\]{}`\\()';@&$]/;
      var title = $("#addService-title").val()
      if (specials.test(title)) {
        notify_user_danger("The following characters are not permitted in the title [ * | \" : < > [ \ ] { } ` \ \ ( ) ' ; @ & $ ]");
        return false
      }
    }

    //CHECKS IF THERE IS AN EMPTY DESCRIPTION //
    if ($("#addService-description").val() == "") {
      notify_user_danger('Please enter a description for this group. This field cannot be blank.');
      return false
    }
    if ($("#table_wrapper").is(':hidden')) {
      notify_user_danger('Please provide a THREDDS endpoint');
      return false
    }
    if ($("#attributes_table").is(':hidden')) {
      notify_user_danger('Please Select a THREDDS File from the given file/folder structure');
      return false
    }
    var url = $('#url').val();
    var timestamp = 'false';
    let units = 'false';
    let color = 'false';
    let attr = {};
    let attr_array = [];
    let variables_list = [];
    $('.attr-checkbox').each(function () {
      if (this.checked) {
        let var_string = $(this).val().split('_a_')[0];
        variables_list.push(var_string);
        let allDimensions = [];
        var x = document.getElementById(`${var_string}_time`);
        if (x != null) {
          allDimensions = $(`#${var_string}_time`).val();
          attr[var_string] = {
            name: var_string,
            dimensions: allDimensions,
            units: units,
            color: color,
          }
          attr_array.push(attr[var_string]);
        } else {
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
          attr_array.push(attr[var_string]);
        }
      }
    })
    if (variables_list.length <= 0) {
      notify_user_danger('Please select at least one variable.');
      return false
    }
    //var groupID = 'user-group-container';
    if ($('#epsg-input').val() == '') {
      var epsg = false;
    } else {
      var epsg = $('#epsg-input').val();
    }
    if (spatial_shape == false) {
      if ($('#spatial-input').val() == '') {
        spatial_shape = false;
      } else {
        spatial_shape = $('#spatial-input').val();
      }
    }

    let authentication = $('#btn-link-authentication').attr('data-auth');
    console.log(authentication)
    let databaseInfo = {
      type: 'file',
      group: current_Group,
      title: $('#addService-title').val(),
      url: url,
      url_wms: wmsURL,
      url_subset: subsetURL,
      epsg: epsg,
      spatial: spatial_shape,
      description: $('#addService-description').val(),
      attributes: attr,
      timestamp: timestamp,
      authentication: authentication,
    };
    $.ajax({
      url: "add-thredds/",
      dataType: 'json',
      // data: {"data":databaseInfo},
      data: {data: JSON.stringify(databaseInfo)},
      type: 'POST',
      success: function (data) {
        try {
          if (data.hasOwnProperty("error")) {
            console.log(data["error"])
            notify_user_danger(data["error"]);
            return false
          } else {
            let group_name_e3;
            Object.keys(id_dictionary).forEach(function (key) {
              if (id_dictionary[key] == current_Group) {
                group_name_e3 = key;
              }
            });
            let id_group_separator = `${group_name_e3}_list_separator`;

            $(`#${group_name_e3}-noGroups`).hide();
            let unique_id_tds = uuidv4();
            id_dictionary[unique_id_tds] = `${title}_join_${current_Group}`
            let layers_style = {}
            let new_title = unique_id_tds;
            let newHtml = html_for_servers(can_delete_groups, new_title, group_name_e3, url, wmsURL, subsetURL);
            $(newHtml).appendTo(`#${id_group_separator}`);

            // UPDATE THE DICT VAR //
            let array_var_ = []
            attr_array.forEach(function (att_single) {
              array_var_.push(att_single['name']);
            })
            dict_file_vars[new_title] = array_var_;

            $(`#${new_title}`).on("click", function () {
              current_tdds = id_dictionary[new_title].split('_join_')[0];
              current_vars = dict_file_vars[new_title];
              opendapURL = $(this).attr("data-opendap-url");
              wmsURL = $(this).attr("data-wms-url");
              subsetURL = $(this).attr("data-subset-url");
            });

            //let input_check_serv = $(`#${new_title}_check`);

            $(`#${new_title}_span`).on("click", function () {
              $('#sG').bootstrapToggle('on');

              //ONLY ONE CHECKBOX AT A TIME//
              current_tdds = id_dictionary[new_title].split('_join_')[0];

              $(`#${new_title}`).css({"border-color": "#2e6da4", "border-width": "2px 2px"});
              $(`#${last_selected_id}`).css({"border-color": "darkgrey", "border-width": "0px 0px"});
              //CLEAN TABLE //
              $("#table_div").empty();
              $("#siteDes").empty();

              //MAKE DROPDOWN MENU FOR VARIABLES//
              options_vars(attr_array, new_title);
              ///MAKE TABLE//

              let table_content = get_table_vars(attr_array, new_title);
              $(table_content).appendTo("#table_div");
              let info_file = make_metadata_file_table(data['services'][0]['metadata_file'], databaseInfo);
              $(info_file).appendTo("#siteDes");

              let layernameUI2 = `${attr_array[0]['name']}_${new_title}`
              layers_style[layernameUI2] = {}
              layers_style[layernameUI2]['title'] = attr_array[0]['name'];
              layers_style[layernameUI2]['opacity'] = $("#opacity-slider").val();
              layers_style[layernameUI2]['wmsURL'] = wmsURL;
              layers_style[layernameUI2]['style'] = $('#wmslayer-style').val();
              layers_style[layernameUI2]['range'] = $('#wmslayer-bounds').val();
              layers_style[layernameUI2]['variable'] = attr_array[0]['name'];
              layers_style[layernameUI2]['subset'] = subsetURL;
              layers_style[layernameUI2]['opendap'] = url;
              layers_style[layernameUI2]['spatial'] = {};
              layers_style[layernameUI2]['epsg'] = epsg;
              layers_style[layernameUI2]['selected'] = false;
              layers_style[layernameUI2]['dimensions'] = attr_array[0]['dimensions'];
              layers_style[layernameUI2]['extra_dim'] = JSON.parse(data['services'][0]['extra_coordinate']);
              layers_dict_wms = layers_style;

              // make the dims dropdown for the first varriable //
              let dim_orders_id = $("#dim_select");
              dim_orders_id.empty();
              dim_orders_id.selectpicker("refresh");

              layers_style[layernameUI2]['dimensions'].forEach(function (dim) {
                let option;
                option = `<option value=${dim} >${dim} </option>`;
                dim_orders_id.append(option);
                dim_orders_id.selectpicker("refresh");
              })
              dim_orders_id.selectpicker('selectAll');

              // extra dim //
              let extra_dim_order = $("#extra_dim");

              if (layers_style[layernameUI2]['dimensions'].length > 3) {
                extra_dim_order.empty();
                extra_dim_order.selectpicker("refresh");
                extra_dim_order.selectpicker('hide');
                let extra_json = layers_style[layernameUI2]['extra_dim'];
                layers_style[layernameUI2]['dimensions'].forEach(function (dim) {
                  if (dim != "lat" && dim != "lon") {
                    if (!dim.includes("time")) {
                      let option;
                      option = `<option value=${dim}> Select a ${dim} val </option>`;
                      extra_dim_order.append(option);
                      extra_json[dim].forEach(function (val_e) {
                        let option2 = `<option value=${val_e}> ${val_e} </option>`;
                        extra_dim_order.append(option2);
                      })
                      extra_dim_order.selectpicker("refresh");
                      extra_dim_order.selectpicker('show');
                    }
                  }
                })
              } else {
                extra_dim_order.empty();
                extra_dim_order.selectpicker("refresh");
                extra_dim_order.selectpicker('hide');
              }
              $('#show_wms').bootstrapToggle('on');

              updateWMSLayer2(layernameUI2, layers_style[layernameUI2])
              // ADD A EVENT LISTENER FOR THE OPCACITY IN THE LAYERS SETTINGS //
              $("#opacity-slider").on("change", function () {
                changeOpacity(layernameUI2, this.value);
                layers_style[layernameUI2]['opacity'] = $("#opacity-slider").val();
              });

              // MAKE THE BUTTON MODAL FOR THE INFORMATION OF THE FILE
              for (let i = 0; i < attr_array.length; ++i) {
                $(`#${attr_array[i]['name']}_${new_title}_info`).on("click", function () {
                  $("#metadata_vars").empty();
                  let info_content = get_metadata_button(attr_array[i]);
                  $(info_content).appendTo("#metadata_vars");
                })

                // DEFINE THE LAYER ATTRIBUTES //
                let layernameUI = `${attr_array[i]['name']}_${new_title}`
                layers_style[layernameUI] = {}
                layers_style[layernameUI]['title'] = attr_array[i]['name'];
                layers_style[layernameUI]['opacity'] = $("#opacity-slider").val();
                layers_style[layernameUI]['wmsURL'] = wmsURL;
                layers_style[layernameUI]['style'] = $('#wmslayer-style').val();
                layers_style[layernameUI]['range'] = $('#wmslayer-bounds').val();
                layers_style[layernameUI]['variable'] = attr_array[i]['name'];
                layers_style[layernameUI]['subset'] = subsetURL;
                layers_style[layernameUI]['opendap'] = url;
                layers_style[layernameUI]['spatial'] = {};
                layers_style[layernameUI]['epsg'] = epsg;
                layers_style[layernameUI]['selected'] = false;
                layers_style[layernameUI]['dimensions'] = attr_array[i]['dimensions'];
                layers_style[layernameUI]['extra_dim'] = JSON.parse(data['services'][0]['extra_coordinate']);

                layers_dict_wms = layers_style;

                // ADD A EVENT LISTENER FOR THE OPCACITY IN THE LAYERS SETTINGS //
                $("#opacity-slider").on("change", function () {
                  changeOpacity(layernameUI, this.value);
                  layers_style[layernameUI]['opacity'] = $("#opacity-slider").val();
                })
              }
              $("#GeneralLoading").addClass("hidden");
              last_selected_id = new_title;
            });
          }
          $("#GeneralLoading").addClass("hidden");

          $("#modalAddServices").modal("hide");
          $('#modalAddServiceForm')[0].reset();
          $("#attributes").empty();
          $("#groups_variables_div").hide();
          $("#vars_search").removeClass("hidden");
          notify_user_success('Added new TDS file');
        } catch (e) {
          console.log(e);
        }
      },
      error: function (error) {
        console.log(error);
        notify_user_danger('There was an error while adding the THREDDS file and its variables to the Group');
      }
    })
  } catch (error) {
    console.log(error);
    notify_user_danger('There was an error while adding the THREDDS file and its variables to the Group');
  }
}

var get_tdds_list_for_group = function () {
  try {
    let group_name_obj = {
      group: current_Group
    };
    $.ajax({
      type: "GET",
      url: `load-group/`,
      dataType: "JSON",
      data: group_name_obj,
      success: function (result) {
        try {
          $modalDelete = $("#modalDelete");
          //Dynamically generate the list of existing hydroservers
          var tdds_list = result["thredds"]
          var HSTableHtml =
              '<table class="table table-condensed-xs" id="tbl-tdds"><thead><th>Select</th><th>THREDDS File</th></thead><tbody>'
          if (tdds_list.length === 0) {
            $modalDelete
                .find(".modal-body")
                .html(
                    "<b>There are no THREDDS files in the Group.</b>"
                )
          } else {
            for (var i = 0; i < tdds_list.length; i++) {
              var title = tdds_list[i].title
              let new_title;
              Object.keys(id_dictionary).forEach(function (key) {
                if (id_dictionary[key] == `${title}_join_${current_Group}`) {
                  new_title = key;
                }
              });
              var url = tdds_list[i].url
              HSTableHtml +=
                  `<tr id="${new_title}deleteID">` +
                  '<td><input class = "check_hs_delete" type="checkbox" name="server" id="server" value="' +
                  title +
                  '"></td>' +
                  '<td class="hs_title">' +
                  title +
                  "</td>" +
                  "</tr>"
            }
            HSTableHtml += "</tbody></table>"
            $modalDelete.find(".modal-body").html(HSTableHtml)
          }
        } catch (e) {
          notify_user_danger('We are having an error trying to get the list of servers that are in the group');
        }
      },
      error: function (error) {
        console.log(error);
        notify_user_danger('An error occurred while trying to get the list of servers in the group');
      }
    })
  } catch (error) {
    notify_user_danger('An error occured while trying to identify the group');
  }
}

var delete_single_tdds = function () {
  let $modalDelete = $("#modalDelete");
  try {
    let group_name_e3;
    Object.keys(id_dictionary).forEach(function (key) {
      if (id_dictionary[key] == current_Group) {
        group_name_e3 = key;
      }
    });
    var datastring = $modalDelete.serialize() //Delete the record in the database
    datastring += `&actual-group=${current_Group}`

    $.ajax({
      type: "POST",
      url: `delete-thredds/`,
      data: datastring,
      dataType: "HTML",
      success: function (result) {
        try {
          var json_response = JSON.parse(result);
          let attributes = json_response['attr_tdds'];
          let json_titles = json_response['title_tdds'];
          $("#modalDelete").modal("hide")
          $("#modalDelete").each(function () {
            this.reset()
          })
          for (let i = 0; i < Object.keys(json_titles).length; ++i) {
            let i_string = i.toString();
            let title = json_titles[i_string];
            let new_title;
            Object.keys(id_dictionary).forEach(function (key) {
              if (id_dictionary[key] == `${title}_join_${current_Group}`) {
                new_title = key;
              }
            });
            $(`#${new_title}-row-complete`).remove()

            let element = document.getElementById(new_title);
            element.parentNode.removeChild(element);

            //REMOVE MAP //

            for (let i = 0; i < attributes[title].length; ++i) {
              // DEFINE THE LAYER ATTRIBUTES //
              let layernameUI = `${attributes[title][i]}_${new_title}`
              removeActiveLayer(layernameUI)
              delete layers_dict_wms[layernameUI]
            }
            let id_group_separator = `${group_name_e3}_list_separator`;
            let separator_element = document.getElementById(id_group_separator);
            let children_element = Array.from(separator_element.children);
            if (children_element.length < 2) {
              $(`#${group_name_e3}-noGroups`).show();
            }
            $(`#${new_title}deleteID`).remove();
            notify_user_success('Successfully deleted the web service');
          }
        } catch (e) {
          console.log(e);
          notify_user_danger('An error occurred while updating the interface, please reload your page');
        }
      },
      error: error => {
        notify_user_danger('An error occurred while deleting the selected web services');
      }
    })
  } catch (e) {
    notify_user_danger('Unable to recognize the groups to delete');
  }
}

var edit_single_tdds = function () {
  let serviceTitle = '';
  let serviceDescription = '';
  let epsg_edit = false;
  let spatial_edit = '';
  let url_edit = '';
  if ($("#editService-title").val() != "") {
    serviceTitle = $("#editService-title").val();
  }
  if ($("#editService-description").val() != "") {
    serviceDescription = $("#editService-description").val();
  }
  if ($('#epsg-input2').val() != '') {
    epsg_edit = $('#epsg-input2').val();
  }
  if ($('#spatial-input2').val() != '') {
    spatial_edit = $('#spatial-input2').val();
  }
  if ($('#url2').val() != '') {
    url_edit = $('#url2').val();
  }

  let request_objt = {
    new_title: serviceTitle,
    old_title: current_tdds,
    group: current_Group,
    description: serviceDescription,
    epsg: epsg_edit,
    spatial: spatial_edit,
    url: url_edit,
  }

  $.ajax({
    url: "edit-thredds/",
    dataType: 'json',
    data: request_objt,
    type: 'POST',
    success: function (data) {
      try {
        if (request_objt['new_title'] != '') {
          let title_e3;
          Object.keys(id_dictionary).forEach(function (key) {
            if (id_dictionary[key] == `${request_objt['old_title']}_join_${request_objt['group']}`) {
              title_e3 = key;
              id_dictionary[key] = `${request_objt['new_title']}_join_${request_objt['group']}`;
            }
          });
          $(`#${title_e3}_span`).html(`${request_objt['new_title']}`);
          $(`#${title_e3}_span`).attr('title', `${request_objt['new_title']}`);
        }
        notify_user_success('`Updating the ${request_objt[\'old_title\']} was Sucessful`');
      } catch (e) {
        console.log(e);
        notify_user_success('There was an error while editing the THREDDS file and its variables to the Group.');
      }
    },
    error: function (error) {
      console.log(error);
      notify_user_danger('There was an error while editing the THREDDS file and its variables to the Group.');
    }
  })
}
