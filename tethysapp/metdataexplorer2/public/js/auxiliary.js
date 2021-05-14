

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
    })

})()
var uuidv4 = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

var html_for_servers = function (title,group_name,isNew){
  try{
    let check_var = (( isNew == true ) ? 'checked' : '');
    let newHtml = `
    <li class="ui-state-default" layer-name="${title}" id="${title}" >
    <span class="server-name tool_tip_h" data-toggle="tooltip" data-placement="right" title="${id_dictionary[title]}">${id_dictionary[title]}</span>
    <input class="chkbx-layer" type="checkbox" data-toggle="tooltip" data-placement="bottom" title="Show/Hide View" ${check_var}>
    <button type="button" id="${title}_${group_name}_reload" class="btn btn-sm" >
     <span  class="glyphicon glyphicon-refresh tool_tip_h" aria-hidden="true" data-toggle="tooltip" data-placement="bottom" title="Update View">
     </span>
    </button>
    <button type="button" id="${title}_zoom" class="btn btn-dark btn-sm" >
     <span class="glyphicon glyphicon-map-marker tool_tip_h" aria-hidden="true" data-toggle="tooltip" data-placement="bottom" title="Zoom to View"></span>
    </button>

    <button id="${title}_variables" class="btn btn-dark btn-sm" data-toggle="modal" data-target="#modalShowVariablesTable"> <span class=" glyphicon glyphicon-list-alt tool_tip_h" data-toggle="tooltip" data-placement="bottom" title="View Variables"></span>
    </button>

    <button type="button" id="${title}_variables_info" class="btn btn-dark btn-sm" data-toggle="modal" data-target="#modalThreddsInformation">
     <span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>
    </button>


    </li>
    `;
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

              <button id="load-from-soap" class="btn btn-primary btn-sm" data-toggle="modal" data-dismiss="modal" data-target="#modalAddSoap">
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
