let URLpath = [];
let containerAttributes = false;


var addAttribute = function(attribute, dimensionString, units, color) {
    let options = '';
    let dimOptions;
    let html = ''
    //
    // if (dimensionString == false) {
    //     dimOptions = `<div style="width: 100%; height: auto; display: flex; flex-direction: row;">
    //                         <b style="margin-right: 12px">Time</b>
    //                         <input class="time-dim-select" style="width: 100px; height: 20px">
    //                         <b>Lat</b>
    //                         <input class="lat-dim-select" style="width: 100px; height: 20px">
    //                         <b>Lon</b>
    //                         <input class="lon-dim-select" style="width: 100px; height: 20px">
    //                       </div>`
    // }
    // else {
    //     let dimensionList = dimensionString.split(',');
    //     for(let i = 0; i < dimensionList.length; i++) {
    //         options += `<option>${dimensionList[i]}</option>`;
    //     }
    //     dimOptions = `<div style="width: 100%; height: auto; display: flex; flex-direction: row;">
    //                         <b style="margin-right: 12px">Time</b>
    //                         <select class="time-dim-select" style="width: 100px">${options}</select>
    //                         <b>Lat</b>
    //                         <select class="lat-dim-select" style="width: 100px">${options}</select>
    //                         <b>Lon</b>
    //                         <select class="lon-dim-select" style="width: 100px">${options}</select>
    //                       </div>`
    // }
    //
    // let count = $('.attr-checkbox').length;
    // let html = `<div class="attr-div">
    //                 <div>
    //                     <input type="checkbox" class="attr-checkbox" checked id="attribute-${count}" style="margin: 0px 10px 0px 20px;">
    //                     <label for="attribute-${count}" style="margin: 0px 0px 20px 0px;">${attribute}</label>
    //                 </div>
    //                 ${dimOptions}
    //                 <div style="width: 100%; height: auto; display: flex; flex-direction: row;">
    //                     <b>Units</b>
    //                     <input class="var-unit-select" style="height: 20px; width: 100px" value="${ units }">
    //                     <b style="margin-left: 111px;">Color Range</b>
    //                     <input class="var-color-select" style="height: 20px; width: 100px" value="${ color }">
    //                 </div>
    //             </div>`;
    let count = $('.attr-checkbox').length;
    if (dimensionString == false) {
      html  += `<tr class="attr-div">
                    <td>
                      <input type="checkbox" class="attr-checkbox" checked id="attribute-${count}">
                    </td>
                    <td style = "word-wrap: break-word;min-width: 160px;max-width: 160px;white-space:normal;">
                      <label for="attribute-${count}">${attribute}</label>
                    </td>
                    <td>
                      <input class="time-dim-select">
                    </td>
                    <td>
                      <span>Lat: </span><input class="lat-dim-select">
                      <br>
                      <span>Lon: </span><input class="lon-dim-select">
                    </td>
                  </tr>`
      // $('#attributes').append(html);

    }
    else{
      let dimensionList = dimensionString.split(',');
      for(let i = 0; i < dimensionList.length; i++) {
          options += `<option>${dimensionList[i]}</option>`;
      }
      html  += `<tr>
                    <td >
                      <input type="checkbox" class="attr-checkbox" checked id="attribute-${count}">
                    </td>
                    <td style = "word-wrap: break-word;min-width: 160px;max-width: 160px;white-space:normal;">
                      <label for="attribute-${count}">${attribute}
                    </td>
                    <td>
                      <select class="selectpicker tables_mul" data-live-search="false" data-width="50%" data-size="mini" data-style="btn-info">${options}</select>
                    </td>
                    <td>
                        <span>Lat: </span><select class="selectpicker tables_mul" data-live-search="false" data-width="50%" data-size="mini" data-style="btn-success">${options}</select>
                        <br>
                        <span>Lon: </span><select class="selectpicker tables_mul" data-live-search="false" data-width="50%" data-size="mini" data-style="btn-success">${options}</select>
                    </td>

                  </tr>`
    }


    return html;
    // $('#attributes').append(html);
}




var make_varaibles_appear = function () {
    if ($('#url').val() == '') {
        alert('Please enter a url to a Thredds Data Server.')
        return
    } else {
        console.log("now we are");
        // $('#loading-modal').modal('show');
        containerAttributes = false;
        // $('#main-body').css('display', 'none');
        // $('#db-forms').css('display', 'block');
        // $('#name-in-form').append($('#url-input').val());
        let html = '';
        let html2 = '';
        let variables = {};
        $('#variable-input option').each(function () {
            variables[$(this).val()] = $(this).attr('data-dimensions');
        });

        for (let variable in variables) {
            let dimensionString = variables[variable];
            console.log(dimensionString)
          html2 += addAttribute(variable, dimensionString, '', '');
        }
        console.log(html2);
        $(html2).appendTo('#attributes');

        let description = $('#metadata-div').attr('data-description');
        $('#dimensions').append(html);
        $('#description-input').append(description);
        urlInfoBox = true;
        $('#loading-modal').modal('hide');
    }
}

var updateFilepath = function() {
    $("#loading-modal").modal("show");
    if ($(this).attr("class") == "folder") {
        let newURL = $(this).attr("data-url");
        console.log(newURL);
        $("#url").val(newURL);
        $("#url2").val(newURL);
        getFoldersAndFiles();
    }
    else if ($(this).attr("class") == "file") {
        // $('#name-in-form').attr('data-type', 'file');
        $("#url").val($(this).text().trim());
        $("#url2").val($(this).text().trim());
        $("#layer-display-container").css("display", "inline");
        // $("#filetree-div").css("display", "none");
        $("#file-info-div").css("display", "flex");
        opendapURL = $(this).attr("data-opendap-url");
        subsetURL = $(this).attr("data-subset-url");
        wmsURL = $(this).attr("data-wms-url");
        if (containerAttributes === false) {
            let variablesAndFileMetadata = getVariablesAndFileMetadata();
            addVariables(variablesAndFileMetadata[0]);
            make_varaibles_appear();
            $(".tables_mul").selectpicker("refresh");

            addFileMetadata(variablesAndFileMetadata[1]);
            // let variableMetadataArray = variableMetadata();
            // addVariableMetadata(variableMetadataArray);
            //addDimensions(dimensionsAndVariableMetadata[0]);
        }
        else {
            addContainerAttributesToUserInputItems();
        }
        // updateWMSLayer();
    }
    $("#loading-modal").modal("hide");
}

function variableMetadata() {
    var variableMetadata = {};
    let variable = $("#variable-input").val();
    $.ajax({
        url: URL_getVariableMetadata,
        data: {
            variable: variable,
            opendapURL: opendapURL
        },
        dataType: "json",
        contentType: "application/json",
        method: "GET",
        async: false,
        success: function (result) {
            variableMetadata = result["variable_metadata"];
        }
    })
    return [variableMetadata];
}

var addVariables = function(variables) {
    console.log(variables)
    let keys = Object.keys(variables);
    keys.sort();
    let html = "";
    for (let i = 0; i < keys.length; i++) {
        html += `<option data-dimensions="${variables[keys[i]]['dimensions']}" data-units="${variables[keys[i]]['units']}" data-color="${variables[keys[i]]['color']}">${keys[i]}</option>`;
    }
    $("#variable-input").empty()
    $(html).appendTo("#variable-input");

    addDimensions($("#variable-input option:selected").attr('data-dimensions'));
    $("#variable-input").selectpicker("refresh");

}

var addDimensions = function(dimensions) {
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

var addVariableMetadata = function(variableMetadata) {
    $("#var-metadata-div").empty().append(variableMetadata);
}

var addFileMetadata = function(fileMetadata) {
    $('#metadata-div').attr('data-description', fileMetadata);
    $(fileMetadata).appendTo("#metadata-div");

    $('#file-metadata-button').css("background-color", "#1600F0");
}
var getVariablesAndFileMetadata = function () {
    //$("#loading-modal").modal("show");
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

var getFoldersAndFiles = function() {
  let elementForm= $("#modalAddGroupServerForm");
  let datastring= elementForm.serialize();
  let form_elements = datastring.split("&");
  let url_alone = form_elements[form_elements.length -1]
  $('#name-in-form').attr('data-type', 'folder');
  $('#loading-group').removeClass("hidden");
    $.ajax({
        url: 'getFilesAndFolders/',
        data: url_alone,
        dataType: "HTML",
        type: "GET",
        success: function (data) {
            var result = JSON.parse(data);
            console.log(result);

            var dataTree = result["dataTree"];
            if (dataTree == "Invalid URL") {
                console.log(dataTree);
            }
            else {
                $("#filetree-div").css("display", "block");
                // $("#file-info-div").css("display", "none");
                var correctURL = result["correct_url"];
                let html =
                `<tbody>`

                console.log(dataTree);
                console.log(Object.keys(dataTree["files"]).length );
                if(Object.keys(dataTree["files"]).length !== 0){
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
                // .append(html);
                $(html).appendTo(`#filetree-div`);
                $("#url-input").val(correctURL);
                if (URLpath[URLpath.length - 1] !== correctURL) {
                    URLpath.push(correctURL);
                }
            }
            // $("#loading-modal").modal("hide");
            $('#loading-group').addClass("hidden");

        },
        error: function(error){
          $('#loading-group').addClass("hidden");
          $.notify(
              {
                  message: `Invalid THREDDS Endpoint`
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
};
