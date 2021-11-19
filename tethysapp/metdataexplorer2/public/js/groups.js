var GROUPS_PACKAGE = (function () {

  $(function () {
    $("#add_groups").on("click", function () {
      isAdding = true;
      $("#btn-add-addServiceToTable").show();
      $("#btn-add-addService2").addClass("hidden");
    })

    $("#btn-check_available_serv").on("click", function () {
      getFoldersAndFiles();
    })
    $('#btn-uplevel').click(function () {
      if (URLpath.length !== 1) {
        let newURL = URLpath[URLpath.length - 2];
        $('#url').val(newURL);
        getFoldersAndFiles();
        URLpath.pop();
      }
    })
    $("#btn-add-addServiceToTable").on("click", addServiceToTable);

    $("#btn-link-authentication").on("click", getCredentials)

    $('#btn-add-addGroup').on("click", function () {
      if ($('#title-input').val() == '') {
        alert('Please specify a name.');
        return
      } else if ($('#description-input').val() == '') {
        alert('Please include a description.');
        return
      } else {
        createDBArray();
        urlInfoBox = false;
      }
    });
    $('#select-all-button').click(function () {
      if ($('#select-all-button').attr('data-select') === 'true') {
        $('#select-all-button').empty();
        $('#select-all-button').html(`<span class="glyphicon glyphicon-check"></span>`);
        $('#select-all-button').attr('data-select', 'false');
        $('.attr-checkbox').each(function () {
          $(this).prop('checked', false);
        });
      } else {
        $('#select-all-button').empty();
        $('#select-all-button').html(`<span class="glyphicon glyphicon-unchecked"></span>`);
        $('#select-all-button').attr('data-select', 'true');
        $('.attr-checkbox').each(function () {
          $(this).prop('checked', true);
        });
      }
    });
    document.getElementById('add-attribute').addEventListener("keyup", searchGroups_group);

    // Display list of Groups in the Delete Groups modal//
    $("#btn-del-groups-f").on("click", make_list_groups);

    // Delete list of Groups in the Delete Groups modal//
    $("#btn-del-hydro-groups").on("click", delete_group_of_hydroservers);
    $("#remove_varaible").on("click", remove_var_from_table);
    $("#btn-filter-groups-f").on("click", give_all_variables);
    $("#btn-attr-search").on("click", apply_var_filter);
    $("#btn-save-auth").on("click", save_credentials);


    document.getElementById('search_attr').addEventListener("keyup", searchVariables_func);
    $("#add_var").on("click", function () {
      $("GeneralLoading").removeClass("hidden")
    })
    // THREDDS LISTENER //
    //DELETION SERVICE
  })
})()

var notify_user_danger = function(message) {
  $.notify(
    {
      message: message,
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
      onShow: function () {
        this.css({'width': 'auto', 'height': 'auto'});
      }
    }
  )
}

var notify_user_info = function(message) {
  $.notify(
    {
      message: message,
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
      onShow: function () {
        this.css({'width': 'auto', 'height': 'auto'});
      }
    }
  )
}

var notify_user_success = function(message) {
  $.notify(
    {
      message: message,
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
      onShow: function () {
        this.css({'width': 'auto', 'height': 'auto'});
      }
    }
  )
}

var apply_var_filter = function () {
  try {
    let elementForm = $("#modalVariablesFilter");
    let datastring = elementForm.serialize();
    $.ajax({
      type: "POST",
      url: `filterTddsByVariable/`,
      dataType: "HTML",
      data: datastring,
      success: function (result) {
        try {
          let result2 = JSON.parse(result);
          let filter_tdds_id = [];
          Object.keys(result2).forEach(function (key_group) {
            result2[key_group].forEach(function (filter_tdds) {
              Object.keys(id_dictionary).forEach(function (keys_uui) {
                if (id_dictionary[keys_uui] == `${filter_tdds}_join_${key_group}`) {
                  filter_tdds_id.push(keys_uui);
                }
              });
            })
          });
          $("#current-GroupThredds").find("li").each(function () {
            var $li = $(this)['0'];
            let id_li = $li['id'];
            if (filter_tdds_id.includes(id_li)) {
              $(`#${id_li}`).css({
                "opacity": "1",
                "border-color": "#ac2925",
                "border-width": "2px",
                "border-style": "solid",
                "color": "black",
                "font-weight": "bold"
              });
              $(`#${id_li} input[type=checkbox]`).each(function () {
                this.checked = true;
              });
            } else {
              $(`#${id_li}`).css({
                "opacity": "0.5",
                "border-color": "#d3d3d3",
                "border-width": "1px",
                "border-style": "solid",
                "color": "#555555",
                "font-weight": "normal"
              });
              // }
            }
          });
          $("#btn-r-reset").show()
        } catch (e) {
          console.log(e);
          notify_user_danger('There was an error trying to retrieve the different Thredds files associated to the variables selected');
        }
      },
      error: function (error) {
        notify_user_danger('There was an error trying to retrieve the different Thredds files associated to the variables selected');
      }
    })
  } catch (e) {
    notify_user_danger('There was an error trying to retrieve the different Thredds files associated to the variables selected');
  }
}

var give_all_variables = function () {
  $.ajax({
    type: "POST",
    url: `getAvailableAttributes/`,
    success: function (result) {
      try {
        let variables_groups = result['attrs'];
        var HSTableHtml =
            `<table id="data-table" class="table table-striped table-bordered table-condensed"><tbody>`
        variables_groups.forEach(l_arr => {
          HSTableHtml += '<tr class="odd gradeX">'
          HSTableHtml += `<td><input type="checkbox" class="filter_check" name="variables" value = "${l_arr}" /> ${l_arr}</td>`;
          HSTableHtml += '</tr>';
        });
        HSTableHtml += "</tbody></table>"
        $("#modalVariablesFilter").find("#groups_variables").html(HSTableHtml);
      } catch (e) {
        notify_user_danger('There was an error trying to retrieve the different countries contained by the web services in the app');
      }
    }
  });
}

var remove_var_from_table = function () {
  $('#added_thredds_files_table_body input:checked').each(function () {
    let index_value = $(this).attr('value');
    let index = add_services_list.findIndex(serv => serv.title == index_value);
    add_services_list.splice(index, 1);
    $(this).parent().parent().remove();
  });
}

var delete_group_of_hydroservers = function () {
  try {
    let datastring = Object.values($("#tbl-groups").find(".chkbx-group"));
    let groups_to_delete = [];
    datastring.forEach(function (data) {
      if (data.checked == true) {
        let group_name = data.value;
        groups_to_delete.push(id_dictionary[group_name]);
      }
    });

    if (groups_to_delete.length > 0) {
      let groups_to_delete_obj = {
        groups: groups_to_delete
      };
      $.ajax({
        type: "POST",
        url: `delete-groups/`,
        dataType: "JSON",
        data: groups_to_delete_obj,
        success: function (result) {
          try {
            let groups_to_erase = result.groups;
            let thredds_to_erase = result.thredds;
            let levels_to_erase = result.levels;

            $("#pop-up_description2").empty();

            groups_to_erase.forEach(function (group) {
              let group_name_e3;
              Object.keys(id_dictionary).forEach(function (key) {
                if (id_dictionary[key] == group) {
                  group_name_e3 = key;
                }
              });
              let element = document.getElementById(group_name_e3);
              element.parentNode.removeChild(element);
              let id_group_separator = `${group_name_e3}_list_separator`;
              let separator = document.getElementById(id_group_separator);
              separator.parentNode.removeChild(separator);
              let group_panel_id = `${group_name_e3}_panel`;
              let group_panel = document.getElementById(group_panel_id);
              group_panel.parentNode.removeChild(group_panel);
              $(`#${group_name_e3}deleteID`).remove();
              thredds_to_erase.forEach(function (thredd_single) {
                //remove layers for the threeds in the dict and also the display
                try {
                  levels_to_erase[`${group}`][`${thredd_single}`].forEach(function (var_name) {
                    removeActiveLayer(`${var_name}_${thredd_single}`);
                  });
                } catch (e) {
                  console.log(e);
                }
              });
            });
            notify_user_success('Successfully Deleted Group!');
          } catch (e) {
            console.log(e);
            notify_user_danger('We are having an error deleting the selected groups of views');
          }
        },
        error: function (error) {
          console.log(error);
          notify_user_danger('We are having an error deleting the selected groups of views');
        }
      });
    } else {
      notify_user_info('You need to select at least one group to delete');
    }
  } catch (err) {
    notify_user_danger('We are having problems trying to recognize the actual group');
  }
}

var make_list_groups = function () {
  try {
    let groupsDiv = $("#current-GroupThredds").find(".panel.panel-default");
    let arrayGroups = Object.values(groupsDiv);
    let finalGroupArray = [];
    arrayGroups.forEach(function (g) {
      if (g.id) {
        let stringGroups = g.id.split("_")[0];
        finalGroupArray.push(stringGroups);
      }
    });
    var HSTableHtml =
        '<table class="table table-condensed-xs" id="tbl-groups"><thead><th>Select</th><th>Catalog Title</th></thead><tbody>'
    if (finalGroupArray.length < 0) {
      $("#modalDeleteGroups").find(".modal-body").html("<b>There are no groups in the Water Data Explorer</b>");
    } else {
      for (var i = 0; i < finalGroupArray.length; i++) {
        var title = finalGroupArray[i]
        HSTableHtml +=
            `<tr id="${title}deleteID">` +
            '<td><input class="chkbx-group" type="checkbox" name="server" value="' +
            title +
            '"></td>' +
            '<td class="hs_title">' +
            id_dictionary[title] +
            "</td>" +
            "</tr>"
      }
      HSTableHtml += "</tbody></table>"
      $("#modalDeleteGroups").find(".modal-body").html(HSTableHtml);
    }
  } catch (error) {
    notify_user_danger('We are having an error trying to make the list of groups in the application');
  }
}

var load_groups_start = function () {
  $.ajax({
    type: "GET",
    url: `get-groups-list/`,
    dataType: "JSON",
    success: result => {
      try {
        let groups = result["groups"];
        $(".divForServers").empty() //Resetting the catalog
        ind = 1;
        groups.forEach(group => {
          let {
            title,
            description
          } = group
          let unique_id_group = uuidv4()
          id_dictionary[unique_id_group] = title;
          let new_title = unique_id_group;
          let id_group_separator = `${new_title}_list_separator`;
          $(`#${new_title}-noGroups`).show();
          let newHtml = html_for_groups(can_delete_groups, new_title, id_group_separator);
          $(newHtml).appendTo("#current-GroupThredds");
          load_individual_thredds_for_group(title);
          $(`#${new_title}_panel`).on("click", function () {
            current_Group = id_dictionary[new_title];
          });
          let $title = "#" + new_title;
          $($title).click(function () {
            $("#pop-up_description2").html("");
            actual_group = `&actual-group=${title}`;
            let description_html = `
                   <h3>Catalog Title</h3>
                   <p>${title}</p>
                   <h3>Catalog Description</h3>
                   <p>${description}</p>`;
            $("#pop-up_description2").html(description_html);
          });
          ind = ind + 1;

        })
        $("#GeneralLoading").addClass("hidden");

      } catch (e) {
        $("#GeneralLoading").addClass("hidden");

        console.log(e);
        notify_user_danger('There was an error while loading the Groups');
      }
    },
    error: function (error) {
      $("#GeneralLoading").addClass("hidden");
      console.log(error);
      notify_user_danger('There was an error while loading the Groups');
    }
  })
}

var addServiceToTable = function () {
  try {
    //CHECK IF WE HAVE A SERVICE WITH THAT NAME ALREADY//
    if (check_for_same_names("Thredds", $("#addService-title").val()) == true) {
      notify_user_info('There is already a Thredds file added with that name, Please Provide a different name');
      return false
    }
    //CHECKS IF THE INPUT IS EMPTY ///
    if ($("#addService-title").val() == "") {
      notify_user_info('Check check! Please enter a title. This field cannot be blank.');
      return false
    }
    if ($("#addService-title").val() != "") {
      var regex = new RegExp("^(?![0-9]*$)[a-zA-Z0-9]+$")
      var specials = /[*|\":<>[\]{}`\\()';@&$]/;
      var title = $("#addService-title").val()
      if (specials.test(title)) {
        notify_user_info("The following characters are not permitted in the title [ * | \" : < > [ \ ] { } ` \ \ ( ) ' ; @ & $ ]");
        return false
      }
    }
    //CHECKS IF THERE IS AN EMPTY DESCRIPTION //
    if ($("#addService-description").val() == "") {
      notify_user_info('Please enter a description for this group. This field cannot be blank.');
      return false
    }
    if ($("#table_wrapper").is(':hidden')) {
      notify_user_info('Please Provide a THREDDS Endpoint');
      return false
    }
    if ($("#attributes_table").is(':hidden')) {
      notify_user_info('Please Select a THREDDS File from the given file/folder structure');
      return false
    }
    var url = $('#url').val();
    var timestamp = 'false';
    let units = 'false';
    let color = 'false';
    let attr = {};
    let variables_list = [];
    $('.attr-checkbox').each(function () {
      if (this.checked) {
        let var_string = $(this).val().split('_a_')[0];
        variables_list.push(var_string);
        let allDimensions = [];
        var x = document.getElementById(`${var_string}_time`);
        if (x != null) {
          var i;
          allDimensions = $(`#${var_string}_time`).val();
          attr[var_string] = {
            dimensions: allDimensions,
            units: units,
            color: color,
          }
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
            dimensions: `${time},${location[0]},${location[1]}`,
            units: units,
            color: color,
          }
        }
      }
    })
    if (variables_list.length <= 0) {
      notify_user_info('Please select at least one variable.');
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
    console.log($('#btn-link-authentication').attr('data-auth'))
    let databaseInfo = {
      type: 'file',
      group: $("#addGroup-title").val(),
      title: $('#addService-title').val(),
      url: url,
      url_wms: wmsURL,
      url_subset: subsetURL,
      epsg: epsg,
      spatial: spatial_shape,
      description: $('#addService-description').val(),
      attributes: attr,
      timestamp: timestamp,
      authentication: $('#btn-link-authentication').attr('data-auth'),
    };
    add_services_list.push(databaseInfo);
    let options = '';
    for (let i = 0; i < variables_list.length; i++) {
      options += `<option>${variables_list[i]}</option>`;
    }
    let html_row = `
    <tr>
      <th class = "hidden" scope="row">${add_services_list.length}</th>
      <td>
        <input type="checkbox" class="attr-checkbox" value="${$('#addService-title').val()}">
      </td>
      <td>
        ${$('#addService-title').val()}
        <button id= "btn-metadata-service-${$('#addService-title').val()}" type="button" class="btn btn-link btn-xs" data-toggle="modal" data-target="#modalMetaDataServiceInfo"><span class="glyphicon glyphicon-question-sign"></button>
      </td>
      <td>
        ${Object.keys(attr).length}
        <button id= "btn-metadata-dropdown-${$('#addService-title').val()}" type="button" class="btn btn-link btn-xs" data-toggle="modal" data-target="#modalDropdownInfo"><span class="glyphicon glyphicon-question-sign"></button>
      </td>
    </tr>
    `
    $("#added_thredds_files_table_body").append(html_row);
    $(`#${$('#addService-title').val()}_vars`).selectpicker('refresh');
    $(`#btn-metadata-service-${$('#addService-title').val()}`).on("click", function () {
      let table_sign = metadata_button_modal(databaseInfo);
      $('#metadata_service_info').empty();
      $(table_sign).appendTo("#metadata_service_info");
    })

    $(`#btn-metadata-dropdown-${$('#addService-title').val()}`).on("click", function () {
      $("#attributes_dims").empty();

      let html = '';
      for (let i = 0; i < variables_list.length; i++) {
        let options = '';
        let options2 = '';
        for (let j = 0; j < attr[variables_list[i]]['dimensions'].length; j++) {
          options += `<option>${attr[variables_list[i]]['dimensions'][j]}</option>`;
          if (j < attr[variables_list[i]]['dimensions'].length - 1) {
            options2 += `${attr[variables_list[i]]['dimensions'][j]}, `
          } else {
            options2 += `${attr[variables_list[i]]['dimensions'][j]}`
          }
        }
        html += `<tr>
                      <td class = "attrbute_name">
                        <label>${variables_list[i]}</label>
                      </td>
                      <td>
                        ${options2}
                      </td>
                    </tr>`
      }
      $(html).appendTo("#attributes_dims");
      $('.modal_dim').selectpicker('selectAll');
      $(".modal_dim").selectpicker("refresh");
    })
    $("#modalAddServices").modal("hide");
    $('#modalAddServiceForm')[0].reset();
    $("#attributes").empty();
    $("#groups_variables_div").hide();
    $("#vars_search").removeClass("hidden");
    // $(html).appendTo("#attributes_dims");
  } catch (error) {
    console.log(error);
    notify_user_danger('There was an error while adding the THREDDS file and its variables to the Group.');
  }
}

var getCredentials = function () {
  if ($('#btn-link-authentication').attr('data-auth') !== 'false') {
    $("#modalAuthentication").modal('show');
  } else {
    $.ajax({
      type: "GET",
      url: `get-credentials/`,
      dataType: "JSON",
      success: result => {
        let authList = result;
        let html = ``;
        console.log(authList)
        for (let key in authList) {
          let auth = `{"machine": "${authList[key][0]}", "user":"${authList[key][1]}", "pswd":"${authList[key][2]}"}`;
          html += `<tr id="new-auth-${authList[key][3]}">
                     <th scope="col"><span><input type="radio" class="auth-radio" name="auth-select" value='${auth}'></span></th>
                     <th scope="col"><span><p>${authList[key][0]}</p></span></th>
                     <th scope="col"><span><p>${authList[key][1]}</p></span></th>
                     <th scope="col"><span><p>${authList[key][2]}</p></span></th>
                     <th scope="col"><button class="delete-auth" type="button" data-machine="${authList[key][0]}" data-user="${authList[key][1]}" data-pswd="${authList[key][2]}" data-line="${authList[key][3]}" onclick="removeCredential(this)"><span class="glyphicon glyphicon-trash"></span></button></th>
                   </tr>`
        }
        html += `<tr id="new-auth">
                   <th scope="col"><span><input type="radio" class="auth-radio" name="auth-select" value="" checked="checked"></span></th>
                   <th scope="col"><span><p>None</p></span></th>
                   <th scope="col"><span></span></th>
                   <th scope="col"><span></span></th>
                   <th scope="col"><span></span></th>
                 </tr>
                 <tr id="new-auth">
                   <th scope="col"><span></span></th>
                   <th scope="col"><input id="new-auth-machine" type="text" class="form-control" style="height: 1.7em"></th>
                   <th scope="col"><input id="new-auth-user" type="text" class="form-control" style="height: 1.7em"></th>
                   <th scope="col"><input id="new-auth-pswd" type="text" class="form-control" style="height: 1.7em"></th>
                   <th scope="col"><button id="add-auth" type="button" onclick="addCredential()"><span class="glyphicon glyphicon-plus"></span></button></th>
                 </tr>`
        $("#added-auth-credentials").empty().append(html);
        $("#modalAuthentication").modal('show');
      }
    })
  }
}

var addCredential = function () {
  let data = {
    machine: $('#new-auth-machine').val(),
    user: $('#new-auth-user').val(),
    pswd: $('#new-auth-pswd').val(),
  };
  if (data['machine'] == '' || data['user'] == '' || data['pswd'] == '') {
    notify_user_info('All fields are required.');
  } else {
    $.ajax({
      type: "GET",
      data: data,
      url: `add-credentials/`,
      dataType: "JSON",
      success: result => {
        let message = result["message"];
        console.log(message);
        getCredentials();
      }
    })
  }
}

var removeCredential = function (object) {
  let data = {
    machine: $(object).attr('data-machine'),
    user: $(object).attr('data-user'),
    pswd: $(object).attr('data-pswd'),
    line: $(object).attr('data-line'),
  };
  $.ajax({
    type: "GET",
    data: data,
    url: `remove-credentials/`,
    dataType: "JSON",
    success: result => {
      let message = result["message"];
      getCredentials();
    }
  })
}

var save_credentials = function () {
  $('#btn-link-authentication').attr('data-auth', $('input[name="auth-select"]:checked').val());
  $('#modalAuthentication').modal('hide');
}

var make_varaibles_appear = function () {
  if ($('#url').val() == '') {
    alert('Please enter a url to a Thredds Data Server.')
    return
  } else {
    containerAttributes = false;
    let html = '';
    let html2 = '';
    let variables = {};
    $('#variable-input option').each(function () {
      variables[$(this).val()] = $(this).attr('data-dimensions');
    });
    for (let variable in variables) {
      let dimensionString = variables[variable];
      html2 += addAttribute(variable, dimensionString, '', '');
    }

    $(html2).appendTo('#attributes');
    $(".tables_mul").selectpicker("selectAll");
    let description = $('#metadata-div').attr('data-description');
    $('#dimensions').append(html);
    $('#description-input').append(description);
    urlInfoBox = true;
  }
}

var updateFilepath = function () {
  if ($(this).attr("class") == "folder") {
    $('#loading-folders').removeClass("hidden");
    let newURL = $(this).attr("data-url");
    $("#url").val(newURL);
    getFoldersAndFiles();
  } else if ($(this).attr("class") == "file") {
    $('#loading-folders').removeClass("hidden");
    let newURL = $(this).attr("data-opendap-url");
    $("#url").val(newURL);

    $("#layer-display-container").css("display", "inline");
    $("#file-info-div").css("display", "flex");
    opendapURL = $(this).attr("data-opendap-url");
    subsetURL = $(this).attr("data-subset-url");
    wmsURL = $(this).attr("data-wms-url");

    $("#attributes").empty();
    let variablesAndFileMetadata = getVariablesAndFileMetadata($(this).attr("data-opendap-url"));
    addVariables(variablesAndFileMetadata[0]);
    make_varaibles_appear();
    $(".tables_mul").selectpicker("refresh");
    addFileMetadata(variablesAndFileMetadata[1]);
    $("#groups_variables_div").show();
    $('#modalFilesStruct').modal('hide');
  }
}

var addVariables = function (variables) {
  let keys = Object.keys(variables);
  keys.sort();
  let html = "";
  for (let i = 0; i < keys.length; i++) {
    html += `<option data-dimensions="${variables[keys[i]]['dimensions']}" data-units="${variables[keys[i]]['units']}" data-color="${variables[keys[i]]['color']}">${keys[i]}</option>`;
  }
  $("#variable-input").empty()
  $(html).appendTo("#variable-input");
  console.log("dimensions" + $("#variable-input option:selected").attr('data-dimensions'));
  addDimensions($("#variable-input option:selected").attr('data-dimensions'));
  $("#variable-input").selectpicker("refresh");

}

var addDimensions = function (dimensions) {
  dimensions = dimensions.split(',');
  let html = "";
  for (let i = 0; i < dimensions.length; i++) {
    html += `<option>${dimensions[i]}</option>`;
  }
  $("#time").empty();
  $(html).appendTo("#time");

  $("#time option:contains('time')").attr('selected', 'selected');
  $("#time").selectpicker("refresh");

}

var addFileMetadata = function (fileMetadata) {
  $('#metadata-div').attr('data-description', fileMetadata);
  $(fileMetadata).appendTo("#metadata-div");
  $('#file-metadata-button').css("background-color", "#1600F0");
}

var getFoldersAndFiles = function () {
  let request_obj = {
    url: $("#url").val()
  }
  $('#name-in-form').attr('data-type', 'folder');
  $('#loading-add-service').removeClass("hidden");
  $.ajax({
    url: 'getFilesAndFolders/',
    data: request_obj,
    dataType: "json",
    contentType: "application/json",
    method: "GET",
    success: function (result) {
      try {
        var dataTree = result["dataTree"];
        if (dataTree == "Invalid URL") {
          notify_user_danger('Invalid THREDDS Endpoint. Be Sure to provide a Catalog URL, and not a OPENDAP Service');
        } else {
          $("#filetree-div").css("display", "block");
          var correctURL = result["correct_url"];
          let html =
              `<tbody>`

          if (Object.keys(dataTree["files"]).length !== 0) {
            for (var file in dataTree["files"]) {
              html += `
                        <tr>
                        <td>
                        <div data-wms-url="${dataTree["files"][file]["WMS"]}"
                                  data-subset-url="${dataTree["files"][file]["NetcdfSubset"]}"
                                  data-opendap-url="${dataTree["files"][file]["OPENDAP"]}"
                                  class="file" onclick="updateFilepath.call(this)">
                                  <span class="glyphicon glyphicon-file" style="height: 20px; margin: 5px 10px 5px 10px"></span>
                                  <p style="padding: 5px 5px 5px 0px">${file}</p></div>
                          </td>
                        </tr>`
            }
          }
          for (var folder in dataTree["folders"]) {
            html += `
                      <tr>
                      <td> <div data-url="${dataTree["folders"][folder]}" class="folder"
                       onclick="updateFilepath.call(this)">
                       <span class="glyphicon glyphicon-folder-open" style="height: 20px; margin: 5px 10px 5px 10px"></span>
                       <p style="padding: 5px 5px 5px 0px">${folder}</p></div>
                      </td>
                      </tr>
                      `
          }
          html += `</tbody>`
          $("#available_services").removeClass("hidden");
          $("#filetree-div").empty();
          $(html).appendTo(`#filetree-div`);
          $("#url").val(correctURL);
          if (URLpath[URLpath.length - 1] !== correctURL) {
            URLpath.push(correctURL);
          }
        }
        $('#loading-folders').addClass("hidden");
        $('#loading-add-service').addClass("hidden");
        $('#modalFilesStruct').modal('show');
        $("#folders_structures").show();
      } catch (e) {
        $('#loading-folders').addClass("hidden");
        $('#loading-add-service').addClass("hidden");
        notify_user_danger('Not able to identify the THREDDS endpoint');
      }
    },
    error: function (error) {
      console.log(error);
      $('#loading-folders').addClass("hidden");
      $('#loading-add-service').addClass("hidden");
      notify_user_danger('Invalid THREDDS Endpoint');
    }
  });
};

var createDBArray = function () {
  $("#loading-add-group").removeClass("hidden");
  try {
    if (check_for_same_names("Group", $("#addGroup-title").val()) == true) {
      $("#loading-add-group").removeClass("hidden");
      notify_user_info('There is already a GRoup with that name, Please Provide other name');
      return false
    }
    //CHECKS IF THE INPUT IS EMPTY ///
    if ($("#addGroup-title").val() == "") {
      $("#loading-add-group").addClass("hidden");
      notify_user_info('Please enter a title. This field cannot be blank.');
      return false
    }
    if ($("#addGroup-title").val() != "") {
      $("#loading-add-group").addClass("hidden");
      var specials = /[*|\":<>[\]{}`\\()';@&$]/;
      var title = $("#addGroup-title").val()
      if (specials.test(title)) {
        notify_user_info("The following characters are not permitted in the title [ * | \" : < > [ \ ] { } ` \ \ ( ) ' ; @ & $ ]");
        return false
      }
    }

    //CHECKS IF THERE IS AN EMPTY DESCRIPTION //
    if ($("#addGroup-description").val() == "") {
      $("#loading-add-group").addClass("hidden");
      notify_user_info('Please enter a description for this group. This field cannot be blank.');
      return false
    }
    let group_info = {
      title: $('#addGroup-title').val(),
      description: $('#addGroup-description').val(),
      attributes: add_services_list,
    };
    $.ajax({
      url: "add-group/",
      dataType: 'json',
      data: {data: JSON.stringify(group_info)},
      type: 'POST',
      success: function (data) {
        add_services_list = [];
        let unique_id_group = uuidv4();
        id_dictionary[unique_id_group] = $('#addGroup-title').val();
        let group = data
        let title = group.title;
        let description = group.description;
        let new_title = unique_id_group;
        let id_group_separator = `${new_title}_list_separator`;
        let newHtml = html_for_groups(can_delete_groups, new_title, id_group_separator);
        $(newHtml).appendTo("#current-GroupThredds");
        $(`#${title}-noGroups`).show();
        load_individual_thredds_for_group(title);
        $("#loading-add-group").addClass("hidden");
        $("#modalAddGroupServerForm").each(function () {
          this.reset();
        })
        $("#modalAddServiceForm").each(function () {
          this.reset();
        });
        $("#added_thredds_files_table_body").empty();
        $("#groups_variables_div").hide();
        $("#filetree-div").empty();
        $("#folders_structures").hide();
        $(`#${new_title}_panel`).on("click", function () {
          current_Group = id_dictionary[new_title];
        });
        notify_user_success('Successfully Created Group of THREDDS to the database');
        $("#modalAddGroupThredds").modal("hide");
      }
    });
  } catch (error) {
    add_services_list = [];
    $("#loading-add-group").addClass("hidden");
    console.log(error);
    notify_user_danger('There was an error while adding the group of THREDDS files');
  }
}
