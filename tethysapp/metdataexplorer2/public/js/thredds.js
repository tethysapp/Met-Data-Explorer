var THREDDS_PACKAGE = (function(){

  $(function(){
    $("#btn-add-addService2").on("click",addSingleThreddsServer);
    $(document).on("click",'#delete-server', get_tdds_list_for_group);
    $("#btn-del-server").on("click", delete_single_tdds);
    //ADDITION SERVICE //
    $(document).on("click", "#add_service", function(){
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
  })

})()

var display_vars_from_Tdds = function(){
  try{
    // make ajax request to know the tdds //
    let request_obj={
      group: current_Group,
      tdds: current_tdds
    };

    $.ajax({
        type: "POST",
        url: `get-vars/`,
        dataType: "JSON",
        data: request_obj,
        success: function(result) {
          try{
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
          }
          catch(e){
            console.log(e);

            $.notify(
                {
                    message: `We are having an error trying to get the list of variables in the current Thredds file`
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
            $.notify(
                {
                  message: `We are having an error trying to get the list of variables in the current Thredds file`
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
  catch(error){
    console.log(error);
  $.notify(
      {
          message: `We are having an error trying to recognize the actual Thedds file`
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


};

var display_vars_from_OpenDabs = function(){
  $('#attributes2').empty();
  $('#warning_msg').empty();

  isAdding = false;
  let html = '';
  let html2 = '';
  let variables = {};
  let variablesAndFileMetadata = getVariablesAndFileMetadata(opendapURL);
  let variables_list = variablesAndFileMetadata[0];
  let keys = Object.keys(variables_list);
  keys.sort();

  for (let i = 0; i < keys.length; i++) {
    let str_dims = "";
    variables_list[keys[i]]['dimensions'].forEach(function(indiv){
      str_dims += `${indiv},`
    })
    try{
      str_dims = str_dims.slice(0, str_dims.length - 1);
    }
    catch(e){
      str_dims = "";
    }

    variables[keys[i]] = str_dims;
  }
  for (let variable in variables) {
    let dimensionString = variables[variable];
    if(!current_vars.includes(variable)){
      html2 += addAttribute(variable, dimensionString, '', '');
    }
  }
  //check if html2?
  if(html2 ==''){
    $(`#table_wrapper2`).hide();
    html2 += `<p> The thredds file does not have variables to add.</p>`;
    $('#warning_msg').removeClass("hidden");
    $(html2).appendTo('#warning_msg');

  }
  else{
    $('#warning_msg').addClass("hidden");
    $(`#table_wrapper2`).show();
    $(html2).appendTo('#attributes2');
  }
  $(".tables_mul").selectpicker("refresh");

  $("#groups_variables_div2").show();

};

var load_individual_thredds_for_group = function(group_name){
   let group_name_obj={
     group: group_name
   };
   $("#GeneralLoading").css({
      'position':'fixed',
      'z-index': '100000',
      'top': '50%',
      'left': '50%',
      'transform': 'translate(-50%, -50%)'
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
                       url_wms,
                       url_subset,
                       epsg,
                       spatial,
                       description,
                       timestamp,
                       attributes,
                       metadata_file
                   } = server
                   let unique_id_tds = uuidv4();
                   id_dictionary[unique_id_tds] = `${title}_join_${group_name}`
                   let layers_style = {}
                   let new_title = unique_id_tds;

                   let newHtml = html_for_servers(can_delete_groups,new_title,group_name_e3, url, url_wms, url_subset);
                   $(newHtml).appendTo(`#${id_group_separator}`);

                   // UPDATE THE DICT VAR //
                   let array_var_ = []
                   attributes.forEach(function(att_single){
                     array_var_.push(att_single['name']);
                   })
                   dict_file_vars[new_title] = array_var_;

                   //EVENTS BUTTONS//
                   $(`#${new_title}`).on("click",function(){
                     current_tdds = id_dictionary[new_title].split('_join_')[0];
                     current_vars = dict_file_vars[new_title];
                     opendapURL = $(this).attr("data-opendap-url");
                     wmsURL = $(this).attr("data-wms-url");
                     subsetURL = $(this).attr("data-subset-url");
                   });
                   //
                   // let input_check_serv = $(`#${new_title}_check`);

                   // input_check_serv.on("click", function(){
                   $(`#${new_title}_span`).on("click",function(){
                     $('#sG').bootstrapToggle('on');

                     current_tdds = id_dictionary[new_title].split('_join_')[0];
                     current_Group = group_name;

                     // current_vars = dict_file_vars[new_title];
                     // opendapURL = $(this).attr("data-opendap-url");
                     // wmsURL = $(this).attr("data-wms-url");
                     subsetURL = $(this).attr("data-subset-url");
                     $("#GeneralLoading").removeClass("hidden");
                     $(`#${new_title}`).css({"border-color":"#2e6da4", "border-width": "2px 2px" });
                     console.log(new_title);
                     $(`#${last_selected_id}`).css({"border-color":"darkgrey", "border-width": "0px 0px"});
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
                    let table_content = get_table_vars(attributes,new_title);

                    let info_file = make_metadata_file_table(metadata_file);
                    $(info_file).appendTo("#siteDes");

                    $(table_content).appendTo("#table_div");
                    //make the layers to display

                    let layernameUI2 = `${attributes[0]['name']}_${new_title}`
                    layers_style[layernameUI2] = {}
                    layers_style[layernameUI2]['title'] = attributes[0]['name'];
                    layers_style[layernameUI2]['opacity']= $("#opacity-slider").val();
                    layers_style[layernameUI2]['wmsURL']= url_wms;
                    layers_style[layernameUI2]['style'] = $('#wmslayer-style').val();
                    layers_style[layernameUI2]['range'] = $('#wmslayer-bounds').val();
                    layers_style[layernameUI2]['variable'] = attributes[0]['name'];
                    layers_style[layernameUI2]['subset'] = url_subset;
                    layers_style[layernameUI2]['opendap'] = url;
                    layers_style[layernameUI2]['spatial'] = {};
                    layers_style[layernameUI2]['epsg'] = epsg;
                    layers_style[layernameUI2]['selected'] = false;
                    layers_style[layernameUI2]['dimensions'] = attributes[0]['dimensions'];
                    layers_dict_wms = layers_style;

                    // make the dims dropdown for the first varriable //
                    let dim_orders_id = $("#dim_select");
                    dim_orders_id.empty();

                    layers_style[layernameUI2]['dimensions'].forEach(function(dim){
                      let option;
                      option = `<option value=${dim} >${dim} </option>`;
                      dim_orders_id.append(option);
                      dim_orders_id.selectpicker("refresh");
                    })
                    dim_orders_id.selectpicker('selectAll');


                    $('#show_wms').bootstrapToggle('on');

                    updateWMSLayer2(layernameUI2,layers_style[layernameUI2])
                    // ADD A EVENT LISTENER FOR THE OPCACITY IN THE LAYERS SETTINGS //
                    $("#opacity-slider").on("change", function(){
                      changeOpacity(layernameUI2,this.value);
                      layers_style[layernameUI2]['opacity']= $("#opacity-slider").val();
                    });


                    // MAKE THE BUTTON MODAL FOR THE INFORMATION OF THE FILE
                    for (let i = 0; i< attributes.length; ++i){
                      $(`#${attributes[i]['name']}_${new_title}_info`).on("click", function(){
                        $("#metadata_vars").empty();
                        let info_content = get_metadata_button(attributes[i]);
                        $(info_content).appendTo("#metadata_vars");
                      })

                      // DEFINE THE LAYER ATTRIBUTES //

                      let layernameUI = `${attributes[i]['name']}_${new_title}`
                      layers_style[layernameUI] = {}
                      layers_style[layernameUI]['title'] = attributes[i]['name'];
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
                      layers_style[layernameUI]['dimensions'] = attributes[i]['dimensions'];

                      layers_dict_wms = layers_style;

                      //ADD A EVENT LISTENER FOR THE OPCACITY IN THE LAYERS SETTINGS //
                      $("#opacity-slider").on("change", function(){
                        changeOpacity(layernameUI,this.value);
                        layers_style[layernameUI]['opacity']= $("#opacity-slider").val();
                      });


                    }
                    $("#GeneralLoading").addClass("hidden");
                    last_selected_id = new_title;


                  });

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
      table_content += `<th > Metadata</th>`;
    }
    if(key != "metadata_var" && key != "color" && key != "name" && key != "units" ){
      table_content += `<th>${key}</th>`;
    }

  });

  // CLOSE HEADER //
  table_content += "</tr></thead>"
    // ADD ROWS //
    table_content += `<tbody id= "table_var_body">`
    for (let i = 0; i< attributes.length; ++i){
      table_content += "<tr>";
      let var_metad = attributes[i];
      // MAKE THE HEADERS FIRST //
      Object.keys(var_metad).forEach(function(key) {
        if(key =="name"){
          let fixed_name = var_metad[key].replace(/_/g, ' ')
          table_content += `<td >${fixed_name}</td>`;
          table_content += `<td>
                    <button id = "${var_metad[key]}_${title}_info" class="btn btn-primary" data-toggle="modal" data-dismiss="modal" data-target="#modalMetaDataInfo">
                        <i class="fas fa-info-circle"></i>
                    </button>
          </td>`;
        }
        //   table_content += `<td>
        //             <input id = "${var_metad[key]}_${title}_check" class="chkbx-variables" type="checkbox" value = "${var_metad[key]}">
        //             <button class="btn btn-primary btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalStyleInfo">
        //               <i class="fas fa-layer-group"></i>
        //             </button>
        //             <button id = "${var_metad[key]}_${title}_info" class="btn btn-primary btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalMetaDataInfo">
        //                 <i class="fas fa-info-circle"></i>
        //             </button>
        //   </td>`;
        // }
        if(key != "metadata_var" && key != "color" && key != "name" && key != "units"){

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

var addSingleThreddsServer = function(){

  try{

    //CHECKS IF THE INPUT IS EMPTY ///
    if($("#addService-title").val() == ""){
      $.notify(
          {
            message: "Please enter a title. This field cannot be blank."
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
      return false
    }

    if ($("#addService-title").val() != "") {
      var regex = new RegExp("^(?![0-9]*$)[a-zA-Z0-9]+$")
      var specials=/[*|\":<>[\]{}`\\()';@&$]/;
      var title = $("#addService-title").val()
      if (specials.test(title)){
        $.notify(
            {
              message: "The following characters are not permitted in the title [ * | \" : < > [ \ ] { } ` \ \ ( ) ' ; @ & $ ]"
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
          return false
      }
    }

    //CHECKS IF THERE IS AN EMPTY DESCRIPTION //
    if($("#addService-description").val() == ""){
      $.notify(
          {
            message: "Please enter a description for this group. This field cannot be blank."
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
      return false
    }
    if($("#filetree-div").is(':hidden')){
      $.notify(
          {
            message: "Please Provide a THREDDS Endpoint"
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
      return false
    }
    if($("#attributes_table").is(':hidden')){
      $.notify(
          {
            message: "Please Select a THREDDS File from the given file/folder structure"
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
              attr_array.push(attr[var_string]);
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
              attr_array.push(attr[var_string]);

            }


        }
    })
    if(variables_list.length <= 0){
      $.notify(
          {
            message: "Please select at least one variable."
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
      return false
    }


    var groupID = 'user-group-container';

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
    let databaseInfo = {
        type: 'file',
        group: current_Group,
        title: $('#addService-title').val(),
        url: url,
        url_wms:wmsURL,
        url_subset:subsetURL,
        epsg: epsg,
        spatial: spatial_shape,
        description: $('#addService-title').val(),
        attributes: attr,
        timestamp: timestamp,
    };
    $.ajax({
        url: "add-thredds/",
        dataType: 'json',
        // data: {"data":databaseInfo},
        data: {data: JSON.stringify(databaseInfo)},
        type: 'POST',
        success: function (data) {
          try{
            if(data.hasOwnProperty("error")) {
              $.notify(
                  {
                    message: `There is Already a Thredds File With This Name In The Group ${current_Group}`
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
              return false
            }
            else{
              let group_name_e3;
              Object.keys(id_dictionary).forEach(function(key) {
                if(id_dictionary[key] == current_Group ){
                  group_name_e3 = key;
                }
              });
              let id_group_separator = `${group_name_e3}_list_separator`;

              $(`#${group_name_e3}-noGroups`).hide();
              let unique_id_tds = uuidv4();
              id_dictionary[unique_id_tds] = `${title}_join_${current_Group}`
              let layers_style = {}
              let new_title = unique_id_tds;
              let newHtml = html_for_servers(can_delete_groups,new_title,group_name_e3, url, wmsURL, subsetURL);
              $(newHtml).appendTo(`#${id_group_separator}`);


              $(`#${new_title}`).on("click",function(){
                current_tdds = id_dictionary[new_title].split('_join_')[0];
                current_vars = dict_file_vars[new_title];
                opendapURL = $(this).attr("data-opendap-url");
                wmsURL = $(this).attr("data-wms-url");
                subsetURL = $(this).attr("data-subset-url");
              });


              let input_check_serv = $(`#${new_title}_check`);

              // input_check_serv.on("click", function(){
              $(`#${new_title}_span`).on("click",function(){
                $('#sG').bootstrapToggle('on');

               //ONLY ONE CHECKBOX AT A TIME//
               // $('input[type="checkbox"]').not(this).prop('checked', false);
               current_tdds = id_dictionary[new_title].split('_join_')[0];

               $(`#${new_title}`).css({"border-color":"#2e6da4", "border-width": "2px 2px" });
               $(`#${last_selected_id}`).css({"border-color":"darkgrey", "border-width": "0px 0px"});
               //CLEAN TABLE //
               $("#table_div").empty();
               $("#siteDes").empty();

              //MAKE DROPDOWN MENU FOR VARIABLES//
              options_vars(attr_array, new_title);
              ///MAKE TABLE//

              let table_content = get_table_vars(attr_array,new_title);
              $(table_content).appendTo("#table_div");
              let info_file = make_metadata_file_table(data['services'][0]['metadata_file']);
              $(info_file).appendTo("#siteDes");


              let layernameUI2 = `${attr_array[0]['name']}_${new_title}`
              layers_style[layernameUI2] = {}
              layers_style[layernameUI2]['title'] = attr_array[0]['name'];
              layers_style[layernameUI2]['opacity']= $("#opacity-slider").val();
              layers_style[layernameUI2]['wmsURL']= wmsURL;
              layers_style[layernameUI2]['style'] = $('#wmslayer-style').val();
              layers_style[layernameUI2]['range'] = $('#wmslayer-bounds').val();
              layers_style[layernameUI2]['variable'] = attr_array[0]['name'];
              layers_style[layernameUI2]['subset'] = subsetURL;
              layers_style[layernameUI2]['opendap'] = url;
              layers_style[layernameUI2]['spatial'] = {};
              layers_style[layernameUI2]['epsg'] = epsg;
              layers_style[layernameUI2]['selected'] = false;
              layers_style[layernameUI2]['dimensions'] = attr_array[0]['dimensions'];
              layers_dict_wms = layers_style;

              // make the dims dropdown for the first varriable //
              let dim_orders_id = $("#dim_select");
              dim_orders_id.empty();

              layers_style[layernameUI2]['dimensions'].forEach(function(dim){
                let option;
                option = `<option value=${dim} >${dim} </option>`;
                dim_orders_id.append(option);
                dim_orders_id.selectpicker("refresh");
              })
              dim_orders_id.selectpicker('selectAll');

              $('#show_wms').bootstrapToggle('on');

              updateWMSLayer2(layernameUI2,layers_style[layernameUI2])
              // ADD A EVENT LISTENER FOR THE OPCACITY IN THE LAYERS SETTINGS //
              $("#opacity-slider").on("change", function(){
                changeOpacity(layernameUI2,this.value);
                layers_style[layernameUI2]['opacity']= $("#opacity-slider").val();
              });

              // MAKE THE BUTTON MODAL FOR THE INFORMATION OF THE FILE
              for (let i = 0; i< attr_array.length; ++i){
                $(`#${attr_array[i]['name']}_${new_title}_info`).on("click", function(){
                  $("#metadata_vars").empty();
                  let info_content = get_metadata_button(attr_array[i]);
                  $(info_content).appendTo("#metadata_vars");
                })

                // DEFINE THE LAYER ATTRIBUTES //

                let layernameUI = `${attr_array[i]['name']}_${new_title}`
                layers_style[layernameUI] = {}
                layers_style[layernameUI]['title'] = attr_array[i]['name'];
                layers_style[layernameUI]['opacity']= $("#opacity-slider").val();
                layers_style[layernameUI]['wmsURL']= wmsURL;
                layers_style[layernameUI]['style'] = $('#wmslayer-style').val();
                layers_style[layernameUI]['range'] = $('#wmslayer-bounds').val();
                layers_style[layernameUI]['variable'] = attr_array[i]['name'];
                layers_style[layernameUI]['subset'] = subsetURL;
                layers_style[layernameUI]['opendap'] = url;
                layers_style[layernameUI]['spatial'] = {};
                layers_style[layernameUI]['epsg'] = epsg;
                layers_style[layernameUI]['selected'] = false;
                layers_style[layernameUI]['dimensions'] = attr_array[i]['dimensions'];
                layers_dict_wms = layers_style;

                // ADD A EVENT LISTENER FOR THE OPCACITY IN THE LAYERS SETTINGS //
                $("#opacity-slider").on("change", function(){
                  changeOpacity(layernameUI,this.value);
                  layers_style[layernameUI]['opacity']= $("#opacity-slider").val();
                })
              }
              $("#GeneralLoading").addClass("hidden");

              last_selected_id = new_title;
              });

            }
            $("#GeneralLoading").addClass("hidden");
            $.notify(
                {
                  message: `Added new TDS File`
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
          }
          catch(e){
            console.log(e);
          }
        },
        error:function(error){
          console.log(error);
          $.notify(
              {
                message: `There was an error while adding the THREDDS file and its variables to the Group.`
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
  catch(error){
    console.log(error);
    $.notify(
        {
          message: `There was an error while adding the THREDDS file and its variables to the Group.`
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


}

var get_tdds_list_for_group = function(){
  try{
    let group_name_obj={
      group: current_Group
    };
    // console.log(id_dictionary)

    $.ajax({
        type: "GET",
        url: `load-group/`,
        dataType: "JSON",
        data:group_name_obj,
        success: function(result) {
          try{
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
                    Object.keys(id_dictionary).forEach(function(key) {
                      if(id_dictionary[key] == `${title}_join_${current_Group}`){
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
          }
          catch(e){
            $.notify(
                {
                    message: `We are having an error trying to get the list of servers that are in the group`
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
            $.notify(
                {
                    message: `We are having an error trying to get the list of servers that are in the group`
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
  catch(error){
  $.notify(
      {
          message: `We are having an error trying to recognize the actual group`
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
}

var delete_single_tdds = function(){
  let $modalDelete = $("#modalDelete");
  try{
    let group_name_e3;
    Object.keys(id_dictionary).forEach(function(key) {
      if(id_dictionary[key] == current_Group ){
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
        success: function(result) {
          try{
            var json_response = JSON.parse(result);
            let attributes= json_response['attr_tdds'];
            let json_titles= json_response['title_tdds'];
            $("#modalDelete").modal("hide")
            $("#modalDelete").each(function() {
                this.reset()
            })
            for(let i=0; i<Object.keys(json_titles).length; ++i){

              let i_string=i.toString();
              let title=json_titles[i_string];
              let new_title;
              Object.keys(id_dictionary).forEach(function(key) {
                if(id_dictionary[key] == `${title}_join_${current_Group}` ){
                  new_title = key;
                }
              });
              $(`#${new_title}-row-complete`).remove()

              let element = document.getElementById(new_title);
              element.parentNode.removeChild(element);

              //REMOVE MAP //

              for (let i = 0; i< attributes[title].length; ++i){
                // DEFINE THE LAYER ATTRIBUTES //
                let layernameUI = `${attributes[title][i]}_${new_title}`
                removeActiveLayer(layernameUI)

              }




              let id_group_separator = `${group_name_e3}_list_separator`;
              let separator_element = document.getElementById(id_group_separator);
              let children_element = Array.from(separator_element.children);
              if(children_element.length < 2){
                $(`#${group_name_e3}-noGroups`).show();

              }
              $(`#${new_title}deleteID`).remove();

              $.notify(
                  {
                      message: `Successfully Deleted the Web Service!`
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

            }
          }
          catch(e){
            console.log(e);
            $.notify(
                {
                    message: `We got a problem updating the interface after deleting the Web Service, please reload your page `
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
        },
        error: error => {
            $.notify(
                {
                    message: `Something went wrong while deleting the selected web services`
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
  catch(e){
    $.notify(
        {
            message: `We are having problems recognizing the actual group or groups to delete.`
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

}

var edit_single_tdds = function(){
  let serviceTitle = '';
  let serviceDescription = '';
  let epsg_edit = '';
  let spatial_edit = '';
  let url_edit = '';
  if($("#editService-title").val() != ""){
    serviceTitle = $("#editService-title").val();
  }
  if ($("#editService-description").val() != ""){
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
      // data: {"data":databaseInfo},
      data: request_objt,
      type: 'POST',
      success: function (data) {
        try{
          if(request_objt['new_title'] != '' ){
            let title_e3;
            Object.keys(id_dictionary).forEach(function(key) {
              if(id_dictionary[key] == `${request_objt['old_title']}_join_${request_objt['group']}` ){
                title_e3 = key;
                id_dictionary[key] = `${request_objt['new_title']}_join_${request_objt['group']}`;
              }
            });
            $(`#${title_e3}_span`).html(`${request_objt['new_title']}`);
            $(`#${title_e3}_span`).attr('title', `${request_objt['new_title']}`);
          }
          $.notify(
              {
                message: `Updating the ${request_objt['old_title']} was Sucessful`
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


        }
        catch(e){
          console.log(e);
          $.notify(
              {
                message: `There was an error while editing the THREDDS file and its variables to the Group.`
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
      error: function(error){
        console.log(error);
        $.notify(
            {
              message: `There was an error while editing the THREDDS file and its variables to the Group.`
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
