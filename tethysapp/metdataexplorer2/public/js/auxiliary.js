

var AUX_PACKAGE = (function(){
    /*
    ****** FU1NCTION NAME: addDefaultBehaviorToAjax *********
    ****** FUNCTION PURPOSE: make dynamic ajax requests *********
    */
    addDefaultBehaviorToAjax = function() {
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
    checkCsrfSafe = function(method) {
        // these HTTP methods do not require CSRF protection
        return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method)
    }
    /*
    ****** FU1NCTION NAME: getCookie *********
    ****** FUNCTION PURPOSE: Retrieve a cookie value from the csrf token *********
    */
    getCookie = function(name) {
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
    activate_deactivate_graphs = function(){

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
      $('#sG').change(activate_deactivate_graphs)
    })


})()
